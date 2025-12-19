import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [status, setStatus] = useState("Finalizing authentication…");

    useEffect(() => {
        const finalizeAuth = async () => {
            try {
                /**
                 * IMPORTANT:
                 * - Email verification uses token/hash flow
                 * - OAuth (Google) uses code flow
                 * Supabase automatically reads the hash/code and sets the session.
                 * We just need to wait for it.
                 */

                // Wait a bit for Supabase to process the callback
                await new Promise(resolve => setTimeout(resolve, 500));

                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("❌ Auth error:", error);
                    toast.error("Authentication failed. Please try again.");
                    navigate("/auth");
                    return;
                }

                if (!data.session) {
                    // Check if there's a hash in the URL (for email verification)
                    const hash = window.location.hash;
                    if (hash) {
                        // Wait a bit more for hash processing
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const { data: retryData, error: retryError } = await supabase.auth.getSession();

                        if (retryError || !retryData.session) {
                            console.error("❌ No session after callback");
                            toast.error("Authentication failed. Please try again.");
                            navigate("/auth");
                            return;
                        }

                        // Session found on retry
                        setStatus("Authentication successful!");
                        toast.success("Welcome!");

                        // Password reset flow
                        if (params.get("mode") === "reset") {
                            navigate("/auth?mode=reset");
                            return;
                        }

                        navigate("/");
                        return;
                    }

                    console.error("❌ No session after callback");
                    toast.error("Authentication failed. Please try again.");
                    navigate("/auth");
                    return;
                }

                // Session found
                setStatus("Authentication successful!");
                toast.success("Welcome!");

                // Password reset flow
                if (params.get("mode") === "reset") {
                    navigate("/auth?mode=reset");
                    return;
                }

                navigate("/");
            } catch (err) {
                console.error("❌ Unexpected error:", err);
                toast.error("An unexpected error occurred.");
                navigate("/auth");
            }
        };

        finalizeAuth();
    }, [navigate, params]);

    return (
        <div className="min-h-screen flex items-center justify-center font-pixel">
            {status}
        </div>
    );
}
