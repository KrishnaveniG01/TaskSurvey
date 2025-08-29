import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authDB } from '../database/authDB';
import { eventAndProcessDB } from 'src/database/eventsDB';
import { BulkVerifyAccessDto } from './dto/bulkVerifyAccess.dto';
import { RowDataPacket } from 'mysql2';

interface AccessRule extends RowDataPacket {
  eventId: string;
  timeFenced: 0 | 1;
  geoFenced: 0 | 1;
}

@Injectable()
export class ProcessEventsService {
  constructor(
    private jwtService: JwtService,
    private authDB: authDB,
  ) {}

  async getEventsByRole(role: 'admin' | 'manager' | 'employee') {
    let roleColumn = '';
    if (role === 'admin') roleColumn = 'isAdmin';
    else if (role === 'manager') roleColumn = 'isManager';
    else if (role === 'employee') roleColumn = 'isEmployee';

    const query = `
      SELECT e.eventId, el.eventName, e.recStatus, e.processId
      FROM orgProcessAccess e
      JOIN eventList el ON e.eventId = el.eventId
      WHERE e.${roleColumn} = 1
    `;

    const [rows] = await eventAndProcessDB.query(query);
    return rows;
  }

  async bulkVerifyUserAccess(dto: BulkVerifyAccessDto, userFromToken: any) {
    const { eventIds, userLatitude, userLongitude } = dto;
    const userId = userFromToken.userId;

    try {
      const [userRows]: any[] = await this.authDB.query(
        'SELECT shiftStartTime, shiftEndTime, storedLatitude, storedLongitude, ShiftActiveDays FROM userCredentials WHERE userId = ?',
        [userId],
      );
      if (userRows.length === 0) {
        throw new NotFoundException('User rules not found.');
      }
      const userRules = userRows[0];

      const [accessRows] = await eventAndProcessDB.query<AccessRule[]>(
        'SELECT eventId, timeFenced, geoFenced FROM orgProcessAccess WHERE eventId IN (?)',
        [eventIds],
      );

      const rulesMap = new Map(
        accessRows.map((rule) => [rule.eventId.toString(), rule]),
      );

      const accessResults = eventIds.map((eventId) => {
        const eventRules = rulesMap.get(eventId);

        if (
          !eventRules ||
          (eventRules.timeFenced != 1 && eventRules.geoFenced != 1)
        ) {
          return { eventId, access: true, reason: '' };
        }

        try {
          if (eventRules.timeFenced == 1) {
            const today = new Date();
            const currentDayNumber = today.getDay();

            const activeDays = Array.isArray(userRules.ShiftActiveDays)
              ? userRules.ShiftActiveDays
              : JSON.parse(userRules.ShiftActiveDays || '[]');

            if (!activeDays.includes(currentDayNumber)) {
              throw new ForbiddenException('Not available on this day.');
            }

            const now = new Date();
            const [startHours, startMinutes] = userRules.shiftStartTime
              .split(':')
              .map(Number);
            const shiftStart = new Date(now);
            shiftStart.setHours(startHours, startMinutes, 0, 0);

            const [endHours, endMinutes] = userRules.shiftEndTime
              .split(':')
              .map(Number);
            const shiftEnd = new Date(now);
            shiftEnd.setHours(endHours, endMinutes, 0, 0);

            // const overtimeGracePeriodMinutes = 60;
            // const shiftEndWithGrace = new Date(
            //   shiftEnd.getTime() + overtimeGracePeriodMinutes * 60000,
            // );

            if (now < shiftStart || now > shiftEnd) {
              throw new ForbiddenException('Outside of shift hours.');
            }
          }

          if (eventRules.geoFenced == 1) {
            if (!userLatitude || !userLongitude) {
              throw new ForbiddenException('Location not provided.');
            }
            const distance = this.calculateDistance(
              userLatitude,
              userLongitude,
              userRules.storedLatitude,
              userRules.storedLongitude,
            );
            if (distance > 500) {
              throw new ForbiddenException('Not within location fence.');
            }
          }

          return { eventId, access: true, reason: '' };
        } catch (error) {
          return { eventId, access: false, reason: error.message };
        }
      });

      return accessResults;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(
        'An unexpected error occurred in bulkVerifyUserAccess:',
        error,
      );
      throw new InternalServerErrorException('An internal error occurred.');
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
