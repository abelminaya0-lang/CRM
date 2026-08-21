import React, { useState, useEffect } from 'react';
import { DJState, Proyecto } from '../types';
import { uid } from '../utils/crmData';

interface ModalProyectoProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId?: string | null;
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onShowToast: (msg: string) => void;
}

export const ModalProyecto: React.FC<ModalProyectoProps> = ({
  isOpen,
  onClose,
  proyectoId,
  state,
  onUpdateState,
  onShowToast,
}) => {
  const isEditing = Boolean(proyectoId);
  const proy = isEditing
    ? (state.proyectos || []).find((p) => p.id === proyectoId)
    : null;

  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [estado, setEstado] = useState<'idea' | 'probando' | 'activo' | 'pausado' | 'descartado'>('idea');
  const [prio, setPrio] = useState<'alta' | 'media' | 'baja'>('media');
  const [paso, setPaso] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (proy) {
      setNombre(proy.nombre || '');
      setDesc(proy.desc || '');
      setEstado(proy.estado || 'idea');
      setPrio(proy.prio || 'media');
      setPaso(proy.paso || '');
    } else {
      setNombre('');
      setDesc('');
      setEstado('idea');
      setPrio('media');
      setPaso('');
    }
  }, [isOpen, proy]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) {
      onShowToast('El nombre del proyecto es obligatorio');
      return;
    }

    if (isEditing && proy) {
      const updated: Proyecto = {
        ...proy,
        nombre: n,
        desc: desc.trim(),
        estado,
        prio,
        paso: paso.trim(),
      };
      onUpdateState((prev) => ({
        ...prev,
        proyectos: (prev.proyectos || []).map((p) => (p.id === proy.id ? updated : p)),
      }));
      onShowToast('Proyecto actualizado ✓');
    } else {
      const newProy: Proyecto = {
        id: uid(),
        creado: Date.now(),
        nombre: n,
        desc: desc.trim(),
        estado,
        prio,
        paso: paso.trim(),
      };
      onUpdateState((prev) => ({
        ...prev,
        proyectos: [...(prev.proyectos || []), newProy],
      }));
      onShowToast('Nuevo proyecto guardado ✓');
    }

    onClose();
  };

  const handleDelete = () => {
    if (!proy) return;
    if (window.confirm('¿Borrar este proyecto?')) {
      onUpdateState((prev) => ({
        ...prev,
        proyectos: (prev.proyectos || []).filter((p) => p.id !== proy.id),
      }));
      onShowToast('Proyecto eliminado');
      onClose();
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isEditing ? 'Editar proyecto' : 'Nuevo proyecto / idea'}</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nombre del proyecto</label>
            <input
              placeholder="Ej: Fiesta propia mensual, Vender pack de samples..."
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Descripción / Objetivo</label>
            <textarea
              placeholder="De qué se trata, cómo monetiza, qué necesitás para arrancarlo..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Estado</label>
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value as
                      | 'idea'
                      | 'probando'
                      | 'activo'
                      | 'pausado'
                      | 'descartado'
                  )
                }
              >
                <option value="idea">Idea en mente</option>
                <option value="probando">Probando / Test</option>
                <option value="activo">Activo y funcionando</option>
                <option value="pausado">Pausado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
            <div className="field">
              <label>Prioridad</label>
              <select
                value={prio}
                onChange={(e) =>
                  setPrio(e.target.value as 'alta' | 'media' | 'baja')
                }
              >
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Próximo paso concreto</label>
            <input
              placeholder="Qué es lo primero que tenés que hacer hoy..."
              value={paso}
              onChange={(e) => setPaso(e.target.value)}
            />
          </div>

          <div className="modal-foot">
            {isEditing && (
              <button
                type="button"
                className="btn danger sm"
                onClick={handleDelete}
              >
                Borrar
              </button>
            )}
            <button
              type="button"
              className="btn ghost sm"
              onClick={onClose}
              style={{ marginLeft: 'auto' }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn sm">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
