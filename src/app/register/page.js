import { Box } from '@mui/material'
import React from 'react'
import RegisterForm from './RegisterForm'
import { palette } from "../../theme/theme"

const page = () => {
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
            <RegisterForm />
        </Box>
    )
}

export default page