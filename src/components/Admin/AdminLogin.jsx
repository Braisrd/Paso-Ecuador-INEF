import React, { useState } from 'react';
import Modal from '../UI/Modal';
import { db, doc, getDoc, setDoc } from '../../services/firebase';

const AdminLogin = ({ onClose, onSuccess }) => {
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const docRef = doc(db, 'config', 'settings');
            const docSnap = await getDoc(docRef);
            let correctPass = 'PasoWeb2526'; // Default password

            if (docSnap.exists()) {
                correctPass = docSnap.data().adminPassword || 'PasoWeb2526';
            } else {
                // First run: Create secure password doc if it doesn't exist
                await setDoc(docRef, { adminPassword: 'PasoWeb2526' });
            }

            if (pass === correctPass) {
                onSuccess();
            } else {
                alert('Contraseña incorrecta');
            }
        } catch (err) {
            console.error(err);
            alert('Error de verificación con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-sky-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl font-bold mb-4">Acceso Admin</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        autoFocus
                        autoComplete="current-password"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-center text-white text-xl tracking-widest mb-4 placeholder-gray-600 focus:border-sky-400 outline-none transition-all"
                        placeholder="••••"
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                    />
                    <div className="flex gap-2 justify-center">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                            Cancelar
                        </button>
                        <button
                            disabled={loading || !pass}
                            className="px-8 py-2 bg-sky-400 text-black font-bold rounded-lg hover:bg-sky-500 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AdminLogin;
