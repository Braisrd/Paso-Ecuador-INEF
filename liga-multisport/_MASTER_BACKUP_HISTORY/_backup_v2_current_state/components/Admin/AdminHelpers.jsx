import React from 'react';
import { Upload, X, Plus } from 'lucide-react';

export const ImageUploader = ({ value, onChange }) => {
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataurl = canvas.toDataURL("image/jpeg", 0.7);
                    resolve(dataurl);
                };
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleFile = async (files) => {
        const file = files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            onChange(compressed);
        } catch (err) {
            alert('Error al procesar la imagen');
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}>
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    onPaste={e => { if (e.clipboardData.files.length) handleFile(e.clipboardData.files); }}
                    placeholder="Imagen (URL, Pegar o Arrastrar)"
                    className="flex-1 bg-black/40 p-3 rounded border border-white/10 text-white"
                />
                <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-3 rounded border border-white/10 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e.target.files)} />
                </label>
            </div>
            {value && <img src={value} className="h-24 rounded object-contain border border-white/10 bg-black/40 w-full" alt="Preview" />}
        </div>
    );
};

export const CustomFormBuilder = ({ fields, onChange }) => {
    const addField = () => onChange([...fields, { id: Date.now(), label: '', type: 'text', options: '' }]);
    const addPreset = () => onChange([...fields,
    { id: Date.now(), label: 'Nombre Completo', type: 'text', options: '' },
    { id: Date.now() + 1, label: 'Email', type: 'text', options: '' },
    { id: Date.now() + 2, label: 'Comentarios', type: 'text', options: '' }
    ]);
    const updateField = (id, k, v) => onChange(fields.map(f => f.id === id ? { ...f, [k]: v } : f));

    return (
        <div className="space-y-4 border border-white/10 p-4 rounded bg-black/20">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm uppercase text-gray-400">Campos del Formulario</h4>
                <div className="flex gap-2">
                    <button type="button" onClick={addPreset} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">+ Presets</button>
                    <button type="button" onClick={addField} className="text-sky-400 text-sm font-bold flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Añadir Campo
                    </button>
                </div>
            </div>
            {fields.map(f => (
                <div key={f.id} className="grid grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded">
                    <input value={f.label} onChange={e => updateField(f.id, 'label', e.target.value)} placeholder="Etiqueta" className="col-span-4 bg-black/40 p-2 rounded text-sm" />
                    <select value={f.type} onChange={e => updateField(f.id, 'type', e.target.value)} className="col-span-3 bg-black/40 p-2 rounded text-sm text-gray-300">
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                        <option value="select">Desplegable</option>
                    </select>
                    <input
                        value={f.options}
                        onChange={e => updateField(f.id, 'options', e.target.value)}
                        placeholder="Opciones (sep. por coma)"
                        className="col-span-4 bg-black/40 p-2 rounded text-sm"
                        disabled={f.type !== 'select'}
                    />
                    <button type="button" onClick={() => onChange(fields.filter(x => x.id !== f.id))} className="col-span-1 text-red-400 flex justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            {fields.length === 0 && <p className="text-xs text-center text-gray-500">Añade campos para el formulario.</p>}
        </div>
    );
};

export const ButtonBuilder = ({ buttons, onChange }) => {
    const addBtn = () => onChange([...(buttons || []), { id: Date.now(), label: '', type: 'link', link: '', style: 'primary', customFields: [] }]);
    const updateBtn = (id, k, v) => onChange(buttons.map(b => b.id === id ? { ...b, [k]: v } : b));
    const removeBtn = (id) => onChange(buttons.filter(b => b.id !== id));

    return (
        <div className="space-y-3 bg-black/20 p-3 rounded border border-white/10">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-400">Botones de Acción</label>
                <button type="button" onClick={addBtn} className="text-xs bg-sky-400 text-black px-2 py-1 rounded font-bold">+ Añadir</button>
            </div>
            {(buttons || []).map(b => (
                <div key={b.id} className="bg-white/5 p-2 rounded relative">
                    <button type="button" onClick={() => removeBtn(b.id)} aria-label="Eliminar botón" className="absolute top-2 right-2 text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                        <input value={b.label} onChange={e => updateBtn(b.id, 'label', e.target.value)} placeholder="Texto del Botón" className="bg-black/40 p-2 rounded text-sm w-full" />
                        <select value={b.type || 'link'} onChange={e => updateBtn(b.id, 'type', e.target.value)} className="bg-black/40 p-2 rounded text-sm w-full">
                            <option value="link">Enlace</option>
                            <option value="form">Formulario</option>
                        </select>
                    </div>
                    <div className="mb-2">
                        <select value={b.style} onChange={e => updateBtn(b.id, 'style', e.target.value)} className="w-full bg-black/40 p-2 rounded text-sm">
                            <option value="primary">Azul (Principal)</option>
                            <option value="secondary">Blanco (Secundario)</option>
                            <option value="outline">Borde (Discreto)</option>
                            <option value="gradient">Gradiente (Destacado)</option>
                        </select>
                    </div>
                    {b.type === 'link' && <input value={b.link} onChange={e => updateBtn(b.id, 'link', e.target.value)} placeholder="https://..." className="w-full bg-black/40 p-2 rounded text-sm" />}
                    {b.type === 'form' && (
                        <div className="mt-2 pl-2 border-l-2 border-sky-400/30">
                            <CustomFormBuilder fields={b.customFields || []} onChange={f => updateBtn(b.id, 'customFields', f)} />
                        </div>
                    )}
                </div>
            ))}
            {(!buttons || buttons.length === 0) && <p className="text-xs text-center text-gray-600">Sin botones.</p>}
        </div>
    );
};
