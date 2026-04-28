import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface PlanItemProps {
  name: string;
  credits: number;
  price: number;
  onEdit: () => void;
  onDelete: () => void;
}

export const PlanItem = ({ name, credits, price, onEdit, onDelete }: PlanItemProps) => (
  <View className="flex-row items-center bg-[#460202] p-4 rounded-[16px] mb-12  border border-gray-800">
    <View className="bg-yellow-500/10 p-3 rounded-full mr-4">
      <FontAwesome5 name="coins" size={20} color="#eab308" />
    </View>
    <View className="flex-1">
      <Text className="text-white text-lg font-bold">{name}</Text>
      <Text className="text-gray-500 font-medium">
        <Text className="text-red-800">{`${credits} Cred`} </Text>
        <Text className="text-green-500">{`Bs ${price}`}</Text>
      </Text>
    </View>
    <View className="flex-row space-x-2 ">
      <TouchableOpacity onPress={onEdit} className="p-2">
        <FontAwesome5 name="edit" size={24} color="#6366f1" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} className="p-2">
        <FontAwesome5 name="trash" size={24} color="#ef4444" />
      </TouchableOpacity>
    </View>
  </View>
);
