# ReVolt - Battery Analysis Platform

A comprehensive React-based platform for monitoring and analyzing battery fleet performance with advanced AI capabilities.

## Features

- **Battery Data Upload**: Support for CSV, XLS, and XLSX files
- **Manual Battery Entry**: Create battery passports with custom specifications
- **AI Agent Analysis**: Neural network-powered battery analysis
- **Real-time Monitoring**: Live battery status and performance tracking
- **Advanced Analytics**: Comprehensive battery health metrics
- **Company Management**: Multi-company support with role-based access

## Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **AI**: Custom neural network analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and auth)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd revolt-ai-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API and business logic
├── contexts/      # React contexts
├── types/         # TypeScript type definitions
└── integrations/  # External service integrations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software. 