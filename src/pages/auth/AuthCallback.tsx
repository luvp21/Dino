import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    useEffect(() => {
        const finalizeAuth = async () => {
            /**
             * IMPORTANT:
             * Email verification uses token/hash flow.
             * Supabase automatically reads the hash and sets the session.
             * We just need to wait for it.
             */
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                console.error("❌ No session after email verification");
                navigate("/auth");
                return;
            }

            // Password reset flow
            if (params.get("mode") === "reset") {
                navigate("/auth?mode=reset");
                return;
            }

            navigate("/");
        };

        finalizeAuth();
    }, [navigate, params]);

    return (
        <div className="min-h-screen flex items-center justify-center font-pixel">
            Finalizing authentication…
        </div>
    );
}
