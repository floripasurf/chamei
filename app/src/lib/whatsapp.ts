const META_API_URL = "https://graph.facebook.com/v21.0";

export async function sendVerificationCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp API credentials not configured");
    return { success: false, error: "Serviço de verificação indisponível" };
  }

  // Normalize phone: ensure it starts with country code 55 for Brazil
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  try {
    const response = await fetch(
      `${META_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: fullPhone,
          type: "template",
          template: {
            name: "verification_code",
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("WhatsApp API error:", JSON.stringify(errorData));
      return { success: false, error: "Falha ao enviar código de verificação" };
    }

    return { success: true };
  } catch (error) {
    console.error("WhatsApp API request failed:", error);
    return { success: false, error: "Falha ao enviar código de verificação" };
  }
}
