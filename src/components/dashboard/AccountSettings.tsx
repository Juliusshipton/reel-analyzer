"use client";

import { useState } from "react";

export function AccountSettings({ userEmail, userName } : { userEmail?: string, userName?: string, }) {
    const [editMode, setEditMode] = useState(false);
    const [passwordWindow, setPasswordWindow] = useState(false);

    function editUserInfo() {
        // TODO: implement (Task 165)
    };

    function changePassword() {
        // TODO: implement (Task 165)
    };

    function forgotPassword() {
        // TODO: implement (Task 171)
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            User Information
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditMode(true)}
                        disabled={editMode}
                        className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        Edit
                    </button>
                </div>

                {editMode ? (
                    <div className="ml-12 space-y-2">
                        <form
                            action={editUserInfo}
                        >
                            <div className="grid grid-cols-[150px_1fr]">
                                <span className="py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Name</span>
                                <input 
                                    id="name"
                                    name="name"
                                    className="py-2 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
                                    defaultValue={userName}
                                />
                            </div>
                            <div className="mt-2 grid grid-cols-[150px_1fr]">
                                <span className="py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Address</span>
                                <input
                                    id="email"
                                    name="email"
                                    className="py-2 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
                                    defaultValue={userEmail}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                ) : ( 
                    <div className="ml-12 space-y-2">
                        <div className="grid grid-cols-[150px_1fr]">
                            <span className="py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Name</span>
                            <span className="py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{userName}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-[150px_1fr]">
                            <span className="py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Address</span>
                            <span className="py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{userEmail}</span>
                        </div>
                    </div>
                )}
            </section>

            <div className="flex flex-wrap items-center gap-4">
                <button
                    type="button"
                    onClick={() => setPasswordWindow(true)}
                    className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                    Change Password
                </button>
            </div>

            {passwordWindow && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 dark:bg-zinc-950">
                        <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center font-bold">
                            Change Password
                        </h3>
                        <form
                            action={changePassword}
                            className="space-y-4"
                        >
                            <Field 
                                id="oldPassword"
                                label="Current password"
                                type="password"
                                autoComplete="old-password"
                            />
                            <Field 
                                id="password"
                                label="New password"
                                type="password"
                                autoComplete="new-password"
                            />
                            <Field 
                                id="confirmPassword"
                                label="Confirm new password"
                                type="password"
                                autoComplete="new-password"
                            />
                            <div className="flex items-center justify-between w-full pt-2">
                                {/* TODO: implement href in following link (Task 171) */}
                                <button 
                                    type="button"
                                    onClick={forgotPassword}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                >
                                    Forgot password?
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPasswordWindow(false)}
                                        className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Save password
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

function Field({
    id,
    label,
    ...inputProps
}: {
    id: string;
    label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={id}
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
                {label}
            </label>
            <input
                id={id}
                name={id}
                required
                className="block h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
                {...inputProps}
            />
        </div>
    );
};