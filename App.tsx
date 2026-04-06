import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { useAuthStore } from "./src/store/authStore";
import AppNavigator from "./src/navigation";

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return <AppNavigator />;
}
