import { Box } from "@mui/material";
import { palette } from "../../theme/theme"
import LoginForm from "./LoginForm";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function LoginPage() {
    const session = await getServerSession(authOptions);
    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.bg,
                px: 2,
            }}
        >
            <LoginForm session={session}/>
        </Box>
    );
}