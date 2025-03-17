import { Text, TouchableOpacity, Image , View } from "react-native";
import { Link } from "expo-router";
import { styles } from "@/styles/auth.styles";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const {signOut} = useAuth();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => signOut()}>
        <Text style={{color: "white"}}>Signout</Text>
      </TouchableOpacity>
    </View>
  );
}