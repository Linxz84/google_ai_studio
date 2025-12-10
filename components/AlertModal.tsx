import React, { useState } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, origin, destination }) => {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send this to a backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      setTargetPrice('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Crear Alerta de Precio</h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-slate-600 mb-4">
                Te avisaremos cuando los vuelos de <span className="font-semibold text-slate-800">{origin || 'origen'}</span> a <span className="font-semibold text-slate-800">{destination || 'destino'}</span> bajen de precio.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tu Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Objetivo (Opcional)</label>
                <input 
                  type="number" 
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Avísame si baja de $..."
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-200"
              >
                Activar Alerta
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¡Alerta Creada!</h3>
              <p className="text-slate-600">Te enviaremos un correo con las mejores ofertas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;