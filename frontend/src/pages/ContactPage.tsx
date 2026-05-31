import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Send,
    MessageCircle,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Mail,
    User,
    HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { submitSupportRequest } from '../lib/auth-api';

export function ContactPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        request_type: 'ACCOUNT_SUSPENDED',
        subject: '',
        description: ''
    });
    const [success, setSuccess] = useState(false);

    const mutation = useMutation({
        mutationFn: submitSupportRequest,
        onSuccess: () => {
            setSuccess(true);
            setFormData({
                full_name: '',
                email: '',
                request_type: 'ACCOUNT_SUSPENDED',
                subject: '',
                description: ''
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                    <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition mb-6 text-sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <MessageCircle className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Contact Support</h1>
                            <p className="text-slate-400">How can we help you with your workspace?</p>
                        </div>
                    </div>
                </div>

                {success ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Request Submitted!</h2>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            We've received your request. Our support team will review it and get back to you at {formData.email} as soon as possible.
                        </p>
                        <Button className="mt-8 px-8" onClick={() => setSuccess(false)}>
                            Send another request
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" /> Name
                                </label>
                                <Input
                                    required
                                    placeholder="Your full name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" /> Email
                                </label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-slate-400" /> Request Type
                            </label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                value={formData.request_type}
                                onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                            >
                                <option value="ACCOUNT_SUSPENDED">Account Suspended</option>
                                <option value="ACCOUNT_APPROVE_REQUEST">Account Approve Request</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        {formData.request_type === 'OTHER' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-semibold text-slate-700">Reason / Subject</label>
                                <Input
                                    required
                                    placeholder="What is this regarding?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Detailed Description</label>
                            <textarea
                                required
                                className="w-full min-h-[120px] p-3 rounded-md border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                placeholder="Provide as much detail as possible..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {mutation.isError && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 border border-red-100 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                Submission failed. Please try again.
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Submitting...' : (
                                <>
                                    <Send className="h-4 w-4" /> Submit Request
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
