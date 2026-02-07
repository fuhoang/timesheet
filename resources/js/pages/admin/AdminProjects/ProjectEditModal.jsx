import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';

export default function ProjectEditModal({ project, onClose, onSave, saving }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setErrors({});
    }
  }, [project]);

  const handleSave = () => {
    if (!name.trim()) {
      setErrors({ name: ['Project name is required'] });
      return;
    }
    onSave({ name, description }, setErrors);
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Edit Project</h3>

        <div className="space-y-3">
          <div className="flex flex-col">
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
          </div>
          <div className="flex flex-col">
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>}
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="primary">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
