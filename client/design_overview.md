# Project Design Overview

This document summarizes the design system and UI patterns used in this project, analyzed from the codebase.

## Core Technologies
- **Styling Framework**: [Tailwind CSS v4](https://tailwindcss.com/) (using the new `@theme` configuration).
- **UI Component Library**: [shadcn/ui](https://ui.shadcn.com/) (Style: New York).
- **Typography**: [Pretendard](https://github.com/orioncactus/pretendard) (Sans-serif).
- **Icons**: [Lucide React](https://lucide.dev/).

## Design Tokens

### Color Palette
The project uses a custom color scale defined in [src/index.css](file:///Users/mccn5/GIT_HOME/FrontEnd/groupware/client/src/index.css):

- **Primary (Blue)**: `#4338ca` (Indigo base), `#6366f1` (Primary Blue 500).
- **Neutrals**: A gray scale from 50 (White) to 950 (Black).
- **Accents**: 
  - **Purple**: `#9333ea`
  - **Pink**: `#db2777`
  - **Orange**: `#f17d16`
  - **Yellow**: `#ffaa00`
- **Functional**:
  - **Positive**: `#4fb95f` (Green)
  - **Negative**: `#d81d00` (Red)

### Typography
- **Font Family**: `Pretendard`, sans-serif.
- **Scale**: `xs` (10px) to `9xl` (72px).
- **Usage**: Bold headings for card titles, medium/regular for body text.

### Shapes & Spacing
- **Border Radius**: Default `--radius` is `0.625rem` (10px).
- **Spacing Unit**: Base spacing is `0.25rem` (4px).

## UI Patterns & Components

### Layout Strategy
- **Card-based Design**: Content is organized inside white cards with light borders (`border-gray-300`) and subtle shadows.
- **Grid System**: Use of responsive grids (e.g., 3-column dashboard on desktop, 1-column on mobile).
- **Responsive Handling**: Sophisticated mobile layouts using `isMobile` hooks and Tailwind utility classes (e.g., `max-md:mt-[50px]!`).

### Key Components
- **SectionHeader**: A standard component for page/section titles with optional descriptions and action buttons.
- **Badge**: Uses several variants, including a custom `dot` variant for status indicators (Vacation, Birthdays, etc.).
- **Avatar**: Circular profile images with fallback support (`getAvatarFallback`).
- **Data Visualization**: Customized components like `WorkHoursBar` for progress/usage metrics.

## Design Philosophy
The design is **clean, professional, and data-centric**. It balances information density with clear visual hierarchy using color-coded badges and logical grouping within cards. The use of 'Pretendard' ensures excellent readability for Korean text.
