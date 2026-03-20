"use client";

import { useState, useEffect, useCallback } from "react";

type Step = "idle" | "sending" | "code" | "verifying" | "success";

export default function ClaimProfile({
  professionalId,
  professionalName,
  phoneLast4Hint,
}: {
  professionalId: string;
  professionalName: string;
  phoneLast4Hint: string;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect on success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        window.location.href = "/meu-perfil";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendCode = useCallback(async () => {
    setStep("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_id: professionalId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("code");
        setResendTimer(60);
      } else {
        setErrorMsg(data.error || "Erro ao enviar código");
        setStep("idle");
      }
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setStep("idle");
    }
  }, [professionalId]);

  async function verifyCode() {
    if (code.length !== 6) {
      setErrorMsg("Digite o código de 6 dígitos");
      return;
    }

    setStep("verifying");
    setErrorMsg("");

    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_id: professionalId,
          code,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("success");
      } else {
        setErrorMsg(data.error || "Código inválido");
        setStep("code");
      }
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setStep("code");
    }
  }

  // Step: idle
  if (step === "idle") {
    return (
      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-sm text-amber-900 font-medium mb-1">
          Este é seu perfil?
        </p>
        <p className="text-xs text-amber-700 mb-3">
          Reivindique para editar suas informações, adicionar fotos e receber mais clientes.
        </p>

        {errorMsg && (
          <p className="text-xs text-red-600 text-center mb-2">{errorMsg}</p>
        )}

        <button
          onClick={sendCode}
          className="w-full bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Reivindicar perfil
        </button>
      </div>
    );
  }

  // Step: sending
  if (step === "sending") {
    return (
      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-amber-900">
            Enviando código de verificação por SMS...
          </p>
        </div>
      </div>
    );
  }

  // Step: success
  if (step === "success") {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="text-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-green-600 text-lg">✓</span>
          </div>
          <p className="text-sm text-green-900 font-medium">
            Perfil verificado!
          </p>
          <p className="text-xs text-green-700 mt-1">
            Redirecionando para seu painel...
          </p>
        </div>
      </div>
    );
  }

  // Step: code input
  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
      <p className="text-sm text-amber-900 font-medium mb-1">
        Código enviado!
      </p>
      <p className="text-xs text-amber-700 mb-3">
        Enviamos um código de 6 dígitos por SMS para o número cadastrado neste perfil ({phoneLast4Hint}). O código é válido por 10 minutos.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          verifyCode();
        }}
        className="space-y-2"
      >
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="w-full px-3 py-2.5 rounded-lg border border-amber-300 text-center text-lg font-mono tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          autoFocus
          disabled={step === "verifying"}
        />

        {errorMsg && (
          <p className="text-xs text-red-600 text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={step === "verifying" || code.length !== 6}
          className="w-full bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {step === "verifying" ? "Verificando..." : "Confirmar código"}
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setCode("");
              setErrorMsg("");
            }}
            className="text-xs text-amber-600 py-1"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={resendTimer > 0}
            onClick={sendCode}
            className="text-xs text-amber-600 py-1 disabled:text-amber-300"
          >
            {resendTimer > 0
              ? `Reenviar em ${resendTimer}s`
              : "Reenviar código"}
          </button>
        </div>
      </form>
    </div>
  );
}
