import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Pointage from './Pointage';
import api from '../api';
import '@testing-library/jest-dom';

jest.mock('../api');

describe('Pointage page', () => {
  const mockData = [
    { id: 1, employee: 'jdoe', date: '2024-01-01', clock_in: '09:00', clock_out: '17:00' },
    { id: 2, employee: 'asmith', date: '2024-01-02', clock_in: '08:30', clock_out: '16:30' },
  ];

  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockData });
    api.post.mockImplementation((url, payload) => {
      const newItem = { id: 3, ...payload };
      mockData.push(newItem);
      return Promise.resolve({ data: newItem });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders fetched pointage rows', async () => {
    render(<Pointage />);
    expect(screen.getByText(/Gestion des Pointages/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('jdoe')).toBeInTheDocument());
    expect(screen.getByText('asmith')).toBeInTheDocument();
  });

  test('adds a new pointage via modal', async () => {
    render(<Pointage />);
    await waitFor(() => screen.getByText('jdoe'));
    const addBtn = screen.getByRole('button', { name: /Ajouter/i });
    fireEvent.click(addBtn);
    // modal appears
    await waitFor(() => expect(screen.getByText(/Nouveau pointage/i)).toBeInTheDocument());
    // fill fields
    fireEvent.change(screen.getByLabelText(/Employé/i), { target: { value: 'bwhite' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2024-01-03' } });
    fireEvent.change(screen.getByLabelText(/Heure d'entrée/i), { target: { value: '09' } });
    fireEvent.change(screen.getByLabelText(/Heure de sortie/i), { target: { value: '17' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/pointage/', {
      employee: 'bwhite',
      date: '2024-01-03',
      clock_in: '09',
      clock_out: '17',
    }));
    expect(screen.getByText('bwhite')).toBeInTheDocument();
  });
});
