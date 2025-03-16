import { Text, TouchableOpacity, Image , View } from "react-native";
import { Link } from "expo-router";
import { styles } from "@/styles/auth.styles";

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href={"/notifications"}>Feed Screen</Link>
    </View>
  );
}