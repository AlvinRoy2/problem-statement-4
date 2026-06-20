import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import App from '../../src/App';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('App Component', () => {
  it('renders the main title', () => {
    renderWithClient(<App />);
    expect(screen.getByText(/EcoTrack AI/i)).toBeInTheDocument();
  });

  it('allows inputting carbon emission amount', () => {
    renderWithClient(<App />);
    const input = screen.getByLabelText(/Enter CO2 Emission in kg/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '15' } });
    expect(input.value).toBe('15');
  });

  it('submits the form', () => {
    renderWithClient(<App />);
    const input = screen.getByLabelText(/Enter CO2 Emission in kg/i);
    const button = screen.getByRole('button', { name: /Log Footprint/i });
    
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(button);
    
    // In our mocked component, submit just clears the field
    expect((input as HTMLInputElement).value).toBe('');
  });
});
