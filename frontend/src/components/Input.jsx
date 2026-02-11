import React from 'react';

const Input = ({ label, type, placeholder, value, onChange, name }) => {
    return (
        <div className="flex flex-col gap-2 mb-4">
            {label && <label className="text-sm font-medium text-dim-text">{label}</label>}
            <input
                type={type}
                name={name}
                className="input"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </div>
    );
};

export default Input;
