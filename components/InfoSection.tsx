export function InfoSection() {
  return (
    <section className="glass-card grid grid-cols-1 gap-6 rounded-3xl p-6 md:grid-cols-3">
      <div>
        <p className="text-sm font-semibold text-white">Como funciona</p>
        <p className="mt-2 text-sm text-slate-200">
          MediaPipe captura pontos de mãos, rosto e corpo. Enviamos esses pontos
          para o OpenRouter, que devolve a palavra provável em português.
        </p>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Dicas de captura</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-200">
          <li>• Boa luz e fundo simples ajudam na detecção.</li>
          <li>• Enquadre mãos e rosto; prefira câmera traseira.</li>
          <li>• Gestos firmes facilitam a inferência.</li>
        </ul>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">
          Dicas para upload de imagem
        </p>
        <ul className="mt-2 space-y-1 text-sm text-slate-200">
          <li>• Use imagens com mãos claramente visíveis</li>
          <li>• Foque em gestos de libras específicos</li>
          <li>• Boa iluminação e fundo contrastante</li>
          <li>• Mãos devem estar em primeiro plano</li>
          <li>
            • Ative "Usar análise de imagem" para análise direta da imagem
          </li>
        </ul>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Privacidade</p>
        <p className="mt-2 text-sm text-slate-200">
          Toda conversa tida desaparece no instante que a pagina faz refresh,
          nao guardadmos nada.
        </p>
      </div>
    </section>
  );
}
