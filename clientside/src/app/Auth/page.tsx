"use client"
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, User, Mail, Apple } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify"
import { useDispatch } from 'react-redux';
import { useRouter } from "next/navigation";
import { setUser } from "../events/slices/authSlice";
import { Button } from "@/components/button";
import { FormControl, InputLabel, TextField } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material"; // Import SelectChangeEvent
import { MenuItem } from "@mui/material";
import { Button as MuiButton } from "@mui/material"

const  Authentication=() =>{
    const router = useRouter();
    // It's good practice to type dispatch
    const dispatch = useDispatch<any>(); // Or AppDispatch from your store setup
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [roles, setRoles] = useState<string[]>([]); // Type roles as string array

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        role: ''
    });

    type FormErrors = {
        email?: string;
        password?: string;
        confirmPassword?: string;
        username?: string;
        general?: string;
        role?: string;
    };

    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch('http://localhost:5000/auth/roles');
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setRoles(data);
            } catch (err) {
                console.error("Failed to fetch roles:", err);
                toast.error("Failed to load roles. Please try again.");
            }
        };
        fetchRoles();
    }, []);

    const validateForm = (): boolean => { // Explicitly return boolean
        const newErrors: FormErrors = {};

        // Role validation (only for register mode)
        if (!isLogin && !formData.role) {
            newErrors.role = "Please select a role";
        }

        // Email validation
        if (!formData.email.trim()) { // Use .trim() for empty string check
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { // FIX: Added '!'
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Enter password";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password length must be 8 characters";
        }

        // Username and Confirm Password validation (only for register mode)
        if (!isLogin) {
            if (!formData.username.trim()) { // Use .trim()
                newErrors.username = 'Full name required';
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = "Please confirm the password";
            } else if (formData.confirmPassword !== formData.password) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }
        setErrors(newErrors); // Update errors state
        return Object.keys(newErrors).length === 0; // Return true if no errors
    };

    // --- Recommended: Wrap your inputs in a <form> and use onSubmit ---
    const handleSubmit = async (event: React.FormEvent) => { // Type event as React.FormEvent
        event.preventDefault(); // Prevent default form submission

        // --- CRITICAL FIX: Validate BEFORE attempting API call ---
        if (!validateForm()) {
            toast.error("Please correct the form errors."); // Give user feedback
            return; // Stop execution if validation fails
        }

        setIsLoading(true);

        const { email, password, username, role } = formData; // Destructure role here

        try {
            if (isLogin) {
                const res = await axios.post('http://localhost:5000/auth/login', {
                    email,
                    password
                });
                if (res.data && res.data.token) { // Check for data and token
                    dispatch(setUser({ role: res.data.payload.role, token: res.data.token, userId: res.data.payload.userId , username:res.data.payload.userName}));
                    localStorage.setItem('username', res.data.payload.username);
                    localStorage.setItem('token', res.data.token);
                    toast.success("Login successful!");
                    router.push("/Home");
                } else {
                    // This case might be hit if backend returns 200 but no token, indicates a logic flaw
                    toast.error("Login failed: Server response incomplete.");
                }
            } else { // Registration
                const response = await axios.post("http://localhost:5000/auth/register", {
                    email,
                    password,
                    role, // Use destructured role
                    username
                });
                if (response.data && response.data.message) { // Assuming message for success
                    toast.success("Registration successful! You can now sign in.");
                    setIsLogin(true); // Switch to login view
                } else {
                    toast.error("Registration failed: Server response incomplete.");
                }
            }
        } catch (error: any) {
    // ✅ THIS IS THE MOST IMPORTANT CHANGE
    // Log the specific validation message from the NestJS backend
    console.error("Backend validation error:", error.response?.data);

    // Display a more user-friendly message
    const apiErrorMessage = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ') // Join multiple errors
        : error.response?.data?.message || 'Something went wrong, please try again.';
    
setErrors({ general: apiErrorMessage });
toast.error(apiErrorMessage);
    } finally {
        setIsLoading(false); // Ensure loading state is reset
    }

};

    // --- MODIFIED handleInputChange to handle SelectChangeEvent for MUI Select ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for the field being typed into
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };


    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setErrors({}); // Clear errors when switching modes
        setFormData({ // Reset form data when switching modes
            email: '',
            password: '',
            confirmPassword: '',
            username: '',
            role: ''
        });
    };

    return (
        <div className="min-h-screen bg-[#C4C4C4] flex items-center justify-center">
            <div className=" w-full max-w-md  shadow-lg  p-8 bg-[#D6D3D2] rounded-3xl">
                <div className="text-center mb-8 ">
                    <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <Apple className='w-6 h-6 text-grey' />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        {isLogin ? 'Sign in to your account' : 'Create your account'}
                    </h1>
                </div>

                {errors.general && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                        <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* --- Recommended: Use a <form> element --- */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <TextField
                                type="text"
                                id='username'
                                name='username'
                                variant="outlined"
                                label='Username'
                                placeholder="Enter your full name"
                                value={formData.username}
                                onChange={handleInputChange}
                                fullWidth // Make TextField take full width
                                error={!!errors.username} // Pass error prop to TextField
                                helperText={errors.username} // Pass error message to TextField
                            // className="..." // If you need custom tailwind, add it carefully
                            />
                        </div>
                    )}

                    <div>
                        <TextField
                            type="email"
                            id='email'
                            variant="outlined"
                            label='Email'
                            name='email'
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </div>

                    <div>
                        <TextField
                            type={showPassword ? 'text' : 'password'}
                            id='password'
                            name='password'
                            label='Password'
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleInputChange}
                            fullWidth
                            error={!!errors.password}
                            helperText={errors.password}
                            InputProps={{ // To position the eye icon correctly within MUI TextField
                                endAdornment: (
                                    <MuiButton
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        sx={{ minWidth: 'auto', padding: '0 8px', color: 'gray' }} // MUI styling overrides
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </MuiButton>
                                ),
                            }}
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <TextField
                                type={showConfirmPassword ? 'text' : 'password'}
                                id='confirmPassword'
                                name='confirmPassword'
                                label='Confirm Password'
                                variant="outlined"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                fullWidth
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                InputProps={{
                                    endAdornment: (
                                        <MuiButton
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            sx={{ minWidth: 'auto', padding: '0 8px', color: 'gray' }}
                                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </MuiButton>
                                    ),
                                }}
                            />
                        </div>
                    )}

                    {!isLogin && (
                        <div >
                            <FormControl fullWidth variant="outlined" error={!!errors.role}>
                                <InputLabel id='select-role-label'>Select a role</InputLabel>
                                <Select
                                    labelId="select-role-label" // Use new labelId
                                    id='role'
                                    name='role'
                                    value={formData.role}
                                    label='Select a role' // This label connects to the InputLabel
                                    onChange={handleInputChange} // This handles SelectChangeEvent
                                >
                                    {roles.map((role, index) => (
                                        <MenuItem key={index} value={role}>
                                            {role}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.role && (
                                    <p className="mt-1 text-sm text-red-600">{errors.role}</p> // Keep manual helper text for Select for now if MUI's isn't styled well with Tailwind
                                )}
                            </FormControl>
                        </div>
                    )}

                    <Button
                        type="submit" // Type submit for form submission
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                            </>
                        ) : (
                            <>
                                <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </form> {/* --- End <form> --- */}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        {' '}
                        <Button
                            onClick={toggleAuthMode}
                            className="text-black hover:text-white font-medium bg-inherit"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </Button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Authentication;