import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Personnel from './Personnel';
import api from '../api';
import '@testing-library/jest-dom';

jest.mock('../api');

describe('Personnel page', () => {
  const mockData = [
    { id: 1, username: 'jdoe', first_name: 'John', last_name: 'Doe', role: 'EMPLOYE' },
    { id: 2, username: 'asmith', first_name: 'Anna', last_name: 'Smith', role: 'MANAGER' },
  ];

  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockData });
    api.post.mockImplementation(({ data }) => Promise.resolve({ data: { id: 3, ...data } }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with fetched personnel', async () => {
    render(<Personnel />);
    expect(screen.getByText(/Gestion du Personnel/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('jdoe')).toBeInTheDocument());
    expect(screen.getByText('asmith')).toBeInTheDocument();
  });

  test('opens modal and adds a new employee', async () => {
    render(<Personnel />);
    await waitFor(() => screen.getByText('jdoe'));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un employé/i }));
    expect(screen.getByText(/Nouvel employé/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/i), { target: { value: 'bwhite' } });
    fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/Nom/i), { target: { value: 'White' } });
    fireEvent.change(screen.getByLabelText(/Rôle/i), { target: { value: 'ADMIN' } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('bwhite')).toBeInTheDocument());
  });
});
