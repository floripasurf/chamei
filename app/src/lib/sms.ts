const TWILIO_API_URL = "https://api.twilio.com/2010-04-01";

export async function sendVerificationCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return { success: false, error: "Serviço de verificação indisponível" };
  }

  // Normalize phone: ensure it starts with +55 for Brazil
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

  const body = `Seu código de verificação no Chamei é: ${code}. Válido por 10 minutos. Não compartilhe este código.`;

  try {
    const response = await fetch(
      `${TWILIO_API_URL}/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: fullPhone,
          From: fromNumber,
          Body: body,
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Twilio API error:", JSON.stringify(errorData));

      // Handle common Twilio trial errors
      if (errorData.code === 21608) {
        return { success: false, error: "Número não verificado. Na versão de teste do Twilio, o número precisa ser verificado primeiro." };
      }

      return { success: false, error: "Falha ao enviar SMS de verificação" };
    }

    const data = await response.json();
    console.log("SMS sent:", data.sid);
    return { success: true };
  } catch (error) {
    console.error("Twilio API request failed:", error);
    return { success: false, error: "Falha ao enviar SMS de verificação" };
  }
}
