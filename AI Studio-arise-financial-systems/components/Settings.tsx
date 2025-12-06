
import React, { useState, useEffect, useRef } from 'react';
import { Check, Camera, Lock, CreditCard, Shield, User, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsProps {
    userProfile: UserProfile;
    onSaveProfile: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, onSaveProfile }) => {
    const [profile, setProfile] = useState(userProfile);
    
    // Persistent Local State for Notifications
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('arise_notifications_v2');
        return saved ? JSON.parse(saved) : { email: true, sms: false };
    });

    // Persistent Local State for Payment Form
    const [paymentInfo, setPaymentInfo] = useState(() => {
        const saved = localStorage.getItem('arise_payment_v2');
        return saved ? JSON.parse(saved) : {
            cardName: '',
            cardNumber: '',
            expiry: '',
            cvc: ''
        };
    });

    // Edit state for payment method - default to false if card exists (secure view), true if empty
    const [isEditingPayment, setIsEditingPayment] = useState(() => {
        const saved = localStorage.getItem('arise_payment_v2');
        const parsed = saved ? JSON.parse(saved) : {};
        return !parsed.cardNumber;
    });

    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync profile state if prop changes (from App.tsx persistence)
    useEffect(() => {
        setProfile(userProfile);
    }, [userProfile]);

    // Save Notifications when changed
    useEffect(() => {
        localStorage.setItem('arise_notifications_v2', JSON.stringify(notifications));
    }, [notifications]);

    // Save Payment Info when changed
    useEffect(() => {
        localStorage.setItem('arise_payment_v2', JSON.stringify(paymentInfo));
    }, [paymentInfo]);

    const handleSave = () => {
        onSaveProfile(profile);
        setIsSaved(true);
        
        // If payment info is valid, lock the view to secure mode
        if (paymentInfo.cardNumber) {
            setIsEditingPayment(false);
        }
        
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-fade-in space-y-6 max-w-5xl mx-auto pb-10">
            <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: General & Notifications */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Information */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <User size={18} className="text-indigo-600" />
                                Profile Information
                            </h3>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <img 
                                            src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.name}`} 
                                            alt="Profile" 
                                            className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50"
                                        />
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <Camera className="text-white" size={24} />
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                    >
                                        Change Photo
                                    </button>
                                </div>

                                {/* Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-slate-900" 
                                            value={profile.name}
                                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-slate-900" 
                                            value={profile.email}
                                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-slate-900" 
                                            value={profile.phone}
                                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Billing */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <CreditCard size={18} className="text-indigo-600" />
                                Subscription & Billing
                            </h3>
                            
                            <div className="bg-slate-50 rounded-lg p-4 border border-gray-200 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">Professional Plan</p>
                                    <p className="text-sm text-gray-500">$99.00 / month • Renews on Nov 1, 2024</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-gray-900">Payment Method</h4>
                                    {isEditingPayment && paymentInfo.cardNumber && (
                                        <button 
                                            onClick={() => setIsEditingPayment(false)}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                
                                {!isEditingPayment && paymentInfo.cardNumber ? (
                                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-200 rounded-lg animate-fade-in">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded border border-gray-200 text-slate-600">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                    <span className="text-gray-400 text-xs tracking-widest mt-1">•••• •••• ••••</span> 
                                                    {paymentInfo.cardNumber.slice(-4)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Expires {paymentInfo.expiry}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditingPayment(true)}
                                            className="text-sm text-indigo-600 font-medium hover:underline"
                                        >
                                            Update
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Cardholder Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Name on Card"
                                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900"
                                                value={paymentInfo.cardName}
                                                onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Card Number</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    placeholder="0000 0000 0000 0000"
                                                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900"
                                                    value={paymentInfo.cardNumber}
                                                    onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                                            <input 
                                                type="text" 
                                                placeholder="MM / YY"
                                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900"
                                                value={paymentInfo.expiry}
                                                onChange={(e) => setPaymentInfo({...paymentInfo, expiry: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">CVC</label>
                                            <input 
                                                type="text" 
                                                placeholder="123"
                                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900"
                                                value={paymentInfo.cvc}
                                                onChange={(e) => setPaymentInfo({...paymentInfo, cvc: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Security & Notifications */}
                <div className="space-y-6">
                     {/* Security */}
                     <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Lock size={18} className="text-indigo-600" />
                                Security
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900" 
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900" 
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-900" 
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                    />
                                </div>
                                <button className="w-full py-2 bg-gray-50 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-100 border border-gray-200">
                                    Update Password
                                </button>
                            </div>
                        </div>
                     </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Bell size={18} className="text-indigo-600" />
                                Notifications
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Email Alerts</span>
                                    <div 
                                        onClick={() => setNotifications(n => ({...n, email: !n.email}))}
                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.email ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications.email ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">SMS Alerts</span>
                                     <div 
                                        onClick={() => setNotifications(n => ({...n, sms: !n.sms}))}
                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.sms ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                     >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications.sms ? 'right-1' : 'left-1'}`}></div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Sticky Footer for Save */}
             <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-white border-t border-gray-100 shadow-lg flex justify-end items-center gap-4 z-20">
                {isSaved && (
                    <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-fade-in">
                        <Check size={16} /> All changes saved
                    </span>
                )}
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm shadow-indigo-200"
                >
                    Save Changes
                </button>
             </div>
        </div>
    );
};

export default Settings;
