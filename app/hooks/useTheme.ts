import { useState, useEffect } from 'react';
import { toggleTheme as utilToggleTheme, isDarkMode } from '~/utils/theme';

/**
 * Hook to read and toggle the app-wide dark/light theme.
 * Syncs with the `dark` class on <html> via ~/utils/theme.
 */
export function useTheme() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Read current state after hydration
        setIsDark(isDarkMode());

        const handleThemeChange = () => {
            setIsDark(isDarkMode());
        };

        window.addEventListener('themechange', handleThemeChange);
        return () => window.removeEventListener('themechange', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        utilToggleTheme();
    };

    return { isDark, toggleTheme };
}
