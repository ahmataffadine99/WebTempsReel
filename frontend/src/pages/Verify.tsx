import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const Verify = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide ou manquant.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`http://localhost:3000/auth/verify?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la vérification');
        }

        setStatus('success');
        setMessage(data.message);
      } catch (err) {
        setStatus('error');
        if (err instanceof Error) setMessage(err.message);
        else setMessage('Erreur inconnue');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="bg-[#1E293B] p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700/50 text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-white">Vérification en cours...</h2>
            <p className="text-gray-400 mt-2">Veuillez patienter pendant la vérification de votre compte.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="bg-green-500/20 p-3 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Compte vérifié !</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <Link
              to="/login"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-blue-500/20 inline-block"
            >
              Aller à la connexion
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="bg-red-500/20 p-3 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Échec de la vérification</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <Link
              to="/register"
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors inline-block"
            >
              Retour à l'inscription
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};
