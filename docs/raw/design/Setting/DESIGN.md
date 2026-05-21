---
name: Lumina Code
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#444655'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#757687'
  outline-variant: '#c5c5d8'
  surface-tint: '#3449e6'
  primary: '#3045e3'
  on-primary: '#ffffff'
  primary-container: '#4d61fc'
  on-primary-container: '#fcf9ff'
  inverse-primary: '#bcc2ff'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#ffde59'
  on-secondary-container: '#756100'
  tertiary: '#286553'
  on-tertiary: '#ffffff'
  tertiary-container: '#437e6b'
  on-tertiary-container: '#ebfff5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bcc2ff'
  on-primary-fixed: '#000b63'
  on-primary-fixed-variant: '#0e29cf'
  secondary-fixed: '#ffe16e'
  secondary-fixed-dim: '#e4c542'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#b1efd8'
  tertiary-fixed-dim: '#96d3bd'
  on-tertiary-fixed: '#002118'
  on-tertiary-fixed-variant: '#0d503f'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.6'
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1200px
---

## Brand & Style

This design system is engineered to transform the intimidating process of learning Python into an inviting, high-energy adventure for children. The aesthetic—**EdTech Modern**—strikes a balance between systematic clarity and playful exploration. 

The visual narrative is built on the concept of "Physicality in Digital Space." By utilizing soft, tactile surfaces and high-vibrancy accents, the UI feels less like a static textbook and more like a responsive toy. Every interaction is designed to evoke a sense of progress and confidence, using a "clean-but-bold" layout that prioritizes focus and reduces cognitive load for younger learners.

## Colors

The palette is anchored by **Electric Blue**, chosen for its high energy and association with technology. **Sunshine Yellow** acts as a secondary catalyst, reserved for "Aha!" moments, achievements, and primary calls to action. **Soft Mint Green** provides a calming counterpoint for success states and secondary UI elements.

- **Backgrounds:** Use a crisp white (#FFFFFF) for the primary canvas, with a very soft grey-blue (#F5F7FA) for container backgrounds to define depth.
- **Accents:** Use a high-contrast dark navy (#1A1C1E) for typography to ensure maximum legibility for developing readers.

## Typography

The typography system relies on **Quicksand** for its rounded terminals and open apertures, making it exceptionally friendly and readable for children. The hierarchy is intentionally oversized to create a clear sense of information priority.

**JetBrains Mono** is introduced specifically for code snippets and technical labels. This distinct shift in font family signals to the learner that they are entering "Logic Mode," while the monospaced nature helps them identify syntax patterns and spacing—critical for Python's indentation-based structure.

## Layout & Spacing

The design system utilizes a **fluid grid** with generous internal padding to avoid a cluttered academic look. The base rhythm is built on an **8px scale**, ensuring all elements feel substantial and easy to tap on touch devices.

- **Mobile:** Single column layout with 16px side margins. Elements are full-width to maximize touch targets.
- **Tablet/Desktop:** 12-column grid. Modules should be grouped into cards with a maximum width of 1200px to maintain line-length readability for the `body-lg` text style.
- **Whitespace:** Use aggressive whitespace (48px+) between major sections to allow the user's eyes to rest between learning modules.

## Elevation & Depth

This design system uses a **Tactile Layering** approach to convey hierarchy. Instead of traditional flat design, we utilize:

1.  **Chunky 3D Shadows:** Cards and buttons use a dual-shadow technique—a soft ambient shadow combined with a hard, 4px-8px offset shadow in a darker tint of the element's base color. This creates a "clickable button" look reminiscent of physical blocks.
2.  **Surface-on-Surface:** Interactive containers should appear slightly elevated (+2px to +4px) compared to background canvases.
3.  **Active States:** When pressed, elements should shift 2px down and right, and the shadow should shrink, simulating a physical mechanical press.

## Shapes

The shape language is defined by **organic, softened geometry**. Sharp corners are strictly avoided to maintain the "safe and friendly" brand promise. 

- **Primary Radius:** 0.5rem (8px) for small components like inputs and checkboxes.
- **Card Radius:** 1.5rem (24px) for major modules to create a distinct, friendly container.
- **Pill Shaping:** All buttons and tags should use a fully rounded "pill" shape to maximize their distinction from content cards.

## Components

### Buttons
Buttons are the most tactile part of the UI. They must have a "chunky" 4px bottom border that is a darker shade of the button color. The label should be `headline-md` for maximum impact. Primary buttons use Electric Blue; "Success" buttons use Soft Mint.

### Cards
Cards are the primary content container. They feature a 1px soft-grey outline and a subtle, tinted drop shadow. For special achievements, cards can have a 4px Sunshine Yellow top border.

### Input Fields
Inputs are oversized (minimum 56px height) with a background color of White and a 2px border that turns Electric Blue when focused. Placeholder text should use a friendly, conversational tone.

### Chunky Icons
Icons should be designed with a 2px or 3px stroke weight and rounded caps. Use a multi-color approach where the main icon is a solid color and a secondary "accent" shape behind it uses 20% opacity of the secondary color.

### Progress Bars
Progress bars should be thick (16px) with a Soft Mint fill and a light-grey track. The progress indicator should include a small "character" icon or a star at the leading edge to encourage the user.

### Code Blocks
Code editors use a dark navy background with high-contrast syntax highlighting (Electric Blue for keywords, Mint Green for strings, Yellow for functions). The container must have large, rounded corners (16px) to match the system's shape language.