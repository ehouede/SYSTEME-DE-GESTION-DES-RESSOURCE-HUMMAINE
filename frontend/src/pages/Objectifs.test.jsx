import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Objectifs from './Objectifs';
import api from '../api';

jest.mock('../api');

describe('Objectifs Page', () => {
  const mockData = [
    { id: 1, title: 'Objectif 1', description: 'Desc 1', status: 'EN_COURS' },
    { id: 2, title: 'Objectif 2', description: 'Desc 2', status: 'TERMINÉ' },
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

  test('renders table with fetched objectifs', async () => {
    render(<Objectifs />);
    expect(screen.getByText(/Gestion des Objectifs/i)).toBeInTheDocument();
    // loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/objectifs/'));
    // rows appear
    expect(screen.getByText('Objectif 1')).toBeInTheDocument();
    expect(screen.getByText('Objectif 2')).toBeInTheDocument();
  });

  test('adds a new objectif via modal form', async () => {
    render(<Objectifs />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    const addButton = screen.getByRole('button', { name: /Ajouter un objectif/i });
    fireEvent.click(addButton);
    // modal appears
    await waitFor(() => expect(screen.getByText(/Nouvel Objectif/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Titre/i), { target: { value: 'Objectif 3' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Desc 3' } });
    fireEvent.mouseDown(screen.getByLabelText(/Statut/i));
    fireEvent.click(screen.getByText('En cours'));
    const submitBtn = screen.getByRole('button', { name: /Créer/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/objectifs/', {
      title: 'Objectif 3',
      description: 'Desc 3',
      status: 'EN_COURS',
    }));
    // new row appears
    expect(screen.getByText('Objectif 3')).toBeInTheDocument();
  });
});
