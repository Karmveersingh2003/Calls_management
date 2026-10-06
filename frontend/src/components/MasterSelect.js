import React, { useEffect, useState } from 'react';
import api from '../services/api';

const MasterSelect = ({ type, label, value, onChange, placeholder = 'Select', required = false }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get(`/masters?type=${type}`).then(res => setItems(res.data.data)).catch(() => {});
  }, [type]);

  const orphanValue = value && !items.some(i => i.name === value) ? value : null;

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select required={required} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {orphanValue && <option value={orphanValue}>{orphanValue}</option>}
        {items.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
      </select>
    </div>
  );
};

export default MasterSelect;