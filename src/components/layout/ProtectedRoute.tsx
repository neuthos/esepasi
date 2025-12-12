import {useAuth} from "@/context/AuthContext";
import {useRouter} from "next/router";
import {useEffect} from "react";

export const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {isAuthenticated, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
