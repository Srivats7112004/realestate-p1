import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({
  children,
  redirectTo = "/login",
  allowedRoles = null,
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
      return;
    }

    if (
      !loading &&
      user &&
      Array.isArray(allowedRoles) &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.role)
    ) {
      router.replace("/profile");
    }
  }, [loading, user, redirectTo, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return null;
  }

  return children;
}