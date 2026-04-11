import React from 'react';
import { View } from 'react-native';
import AdminBottomNav from '../components/admin/AdminBottomNav';


interface Props {
    children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
    return (
        <View className="flex-1 bg-black">

            <View className="flex-1">
                {children}
            </View>

            <AdminBottomNav />
        </View>
    );
};
