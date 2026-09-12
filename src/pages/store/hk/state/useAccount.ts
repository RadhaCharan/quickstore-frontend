// Re-export from a separate file so React Fast Refresh sees a pure hook module
// (Fast Refresh requires files to export either ONLY components or ONLY non-component values)
export { useAccount } from './account';
