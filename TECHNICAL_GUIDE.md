# Technical Implementation Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  (Login, Register, Product, Cart Pages & Components)    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Context & State Layer                  │
│  (CartContext for state management)                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 Browser LocalStorage                     │
│  (Persistent user and cart data)                        │
└─────────────────────────────────────────────────────────┘
```

## Component Structure

### Authentication Flow

```
App Layout (RootLayout)
├── ThemeProvider
├── CartProvider
│   ├── Navbar
│   │   ├── Authentication UI (Login/User Menu)
│   │   ├── Cart Count Badge
│   │   └── Search Functionality
│   │
│   └── Pages
│       ├── auth/login/page.tsx
│       ├── auth/register/page.tsx
│       └── [other pages with cart integration]
│
└── Toaster (for notifications)
```

### Cart Management Flow

```
Product Detail Page
    ↓
Add to Cart (click)
    ↓
useCart() Hook
    ↓
CartContext.addItem()
    ↓
Update Local State
    ↓
Save to localStorage
    ↓
Cart Page / Navbar Updates
```

## Key Files & Their Responsibilities

### 1. **Authentication Files**

#### `app/auth/login/page.tsx`
```typescript
Responsibilities:
- Form state management (email, password, showPassword)
- Form validation (required fields, password length)
- Mock authentication logic
- localStorage write on success
- Router navigation
- Error handling
```

**Key Functions:**
- `handleSubmit()` - Validates and stores user data
- `setShowPassword()` - Toggle password visibility

**User Data Structure:**
```typescript
{
  id: string,           // "user-" + timestamp
  email: string,        // user's email
  name: string,         // derived from email
  role: "admin" | "customer"  // determined by email
}
```

#### `app/auth/register/page.tsx`
```typescript
Responsibilities:
- Multi-field form state management
- Complex validation logic
- Password confirmation
- Terms acceptance
- User creation with full details
- Automatic login on success
```

**Key Functions:**
- `handleChange()` - Update form fields
- `handleSubmit()` - Comprehensive validation and registration

**User Data Structure:**
```typescript
{
  id: string,           // "user-" + timestamp
  email: string,
  name: string,         // from fullName
  phone: string,
  role: "customer"      // always customer on registration
}
```

### 2. **Navbar Component** (`components/navbar.tsx`)

```typescript
Responsibilities:
- Load user from localStorage on mount
- Display authentication UI based on user state
- Show/hide user menu and logout option
- Display dynamic cart count
- Search functionality
- Responsive mobile menu
```

**Key Hooks:**
- `useState()` - Managing UI state (menus, search, user)
- `useEffect()` - Loading user data on mount
- `useCart()` - Getting cart item count
- `useRouter()` - Navigation for logout
- `usePathname()` - Active route detection

**Key States:**
```typescript
const [user, setUser] = useState<User | null>(null);
const [mounted, setMounted] = useState(false);
const { itemCount } = useCart();
```

**Why `mounted` State?**
- Prevents hydration mismatch
- localStorage only available on client
- Ensures render consistency

### 3. **Cart Context** (`lib/cart-context.tsx`)

```typescript
Interface Definitions:
- CartItem: { productId, quantity, product? }
- CartContextType: All cart operations + calculations

Responsibilities:
- Maintain cart state
- Add/remove/update items
- Persist to localStorage
- Calculate totals and shipping
- Provide hook for component access
```

**Context Methods:**
```typescript
interface CartContextType {
  items: CartItem[];                                    // All cart items
  addItem: (product: Product, quantity: number) => void;  // Add or merge
  removeItem: (productId: string) => void;              // Remove item
  updateQuantity: (productId: string, quantity: number) => void; // Change qty
  clearCart: () => void;                                // Empty cart
  total: number;                                        // Final amount
  subtotal: number;                                     // Before shipping
  itemCount: number;                                    // Total qty
}
```

**LocalStorage Lifecycle:**
```
Mount
  ↓
useEffect (empty deps) runs
  ↓
Read from localStorage['cart']
  ↓
Parse JSON, handle errors
  ↓
Set items state
  ↓
Set mounted = true

Every State Change
  ↓
useEffect (items, mounted deps) runs
  ↓
If mounted (prevent initial save)
  ↓
Stringify items to JSON
  ↓
Save to localStorage['cart']
```

**Item Merging Logic:**
```typescript
When addItem() called:
  - Check if product already exists
  - If yes: increase quantity
  - If no: add new item
  - Prevents duplicates
```

**Calculations:**
```typescript
subtotal = sum(product.price * item.quantity for each item)
shipping = subtotal > 5000 ? 0 : 200
total = subtotal + shipping
itemCount = sum(item.quantity for each item)
```

### 4. **Product Detail Page** (`app/products/[id]/page.tsx`)

```typescript
Responsibilities:
- Load product from data
- Display product information
- Manage quantity selection
- Integration with cart
- Show toast notifications
```

**Add to Cart Handler:**
```typescript
const handleAddToCart = async () => {
  setIsAdding(true);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // Add to cart via context
  addItem(product, quantity);
  // Show confirmation
  setIsAdding(false);
  toast({ title: "Added to cart", ... });
}
```

## Data Flow Diagrams

### User Registration & Login

```
User fills form → Validation → Store in localStorage → Auto-login → Redirect
                                        ↓
                            {id, email, name, role}
```

### Add to Cart

```
Product Page → Select Qty → Click Add → useCart().addItem() 
                                              ↓
                                    Update context state
                                              ↓
                                    Save to localStorage
                                              ↓
                           Update navbar (itemCount)
                                              ↓
                                   Show toast + reset qty
```

### Cart Persistence

```
Page Load
    ↓
Navbar mounts
    ↓
useEffect runs (no deps)
    ↓
Check localStorage['cart']
    ↓
Found? → Parse & set state
Not Found? → Empty cart
    ↓
At any change:
    ↓
useEffect (items, mounted)
    ↓
Mounted? → Save to storage
```

## State Management Strategy

### Why Context API (not Redux)?

1. **Simpler for small/medium projects**
2. **No external dependencies**
3. **Built into React**
4. **Easy to understand flow**
5. **Sufficient for this feature set**

### Why localStorage (not API)?

1. **Demo application**
2. **No backend server**
3. **Offline functionality**
4. **Per-device persistence**
5. **Privacy (data stays on device)**

### Hydration Handling

**Problem:** Server renders before client hydrates
**Solution:** Use `mounted` state

```typescript
// Won't render until client-side
if (!mounted) return null;

// Safe to use localStorage after this
const savedCart = localStorage.getItem('cart');
```

## Type Safety

### User Type
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
```

### Cart Types
```typescript
interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
  itemCount: number;
}
```

## Error Handling

### Authentication Errors
- Empty fields validation
- Password length validation
- Password mismatch validation
- Terms acceptance validation

### Cart Errors
- Invalid localStorage data handling
- Silent fallback to empty cart
- Graceful error messages

### Rendering Errors
- Safe null checks
- Conditional rendering
- Fallback components

## Performance Optimizations

### 1. **useMemo in CartContext**
```typescript
const value = useMemo(() => ({
  items, addItem, removeItem, updateQuantity, 
  clearCart, total, subtotal, itemCount
}), [items]);
```
- Prevents unnecessary re-renders
- Only recalculates when items change

### 2. **Conditional Rendering in Navbar**
```typescript
// Only re-render navbar when mounted or user changes
if (!mounted) return null;
```

### 3. **useEffect Dependencies**
```typescript
// Load on mount: []
// Save on change: [items, mounted]
```

## Testing Scenarios

### 1. **Registration Flow**
- [ ] All required fields empty → error
- [ ] Passwords don't match → error
- [ ] Password < 6 chars → error
- [ ] Terms not agreed → error
- [ ] Valid submission → success + redirect

### 2. **Login Flow**
- [ ] Empty fields → error
- [ ] Password < 6 chars → error
- [ ] Valid submission → success + redirect
- [ ] Demo credentials work

### 3. **Cart Operations**
- [ ] Add item → cart count updates
- [ ] Refresh page → cart persists
- [ ] Change quantity → total updates
- [ ] Remove item → updates count
- [ ] Clear browser storage → cart empty

### 4. **User Menu**
- [ ] User info displays correctly
- [ ] Admin badge shows for admins
- [ ] Logout removes user data
- [ ] Cart accessible after login

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support
- **localStorage:** All modern browsers
- **Form API:** All modern browsers

## Accessibility Features

- Semantic HTML elements
- Form labels associated with inputs
- Icon buttons have labels
- Keyboard navigation support
- Color contrast compliance
- Focus states visible

## Security Considerations

### Current Implementation
- ✅ Mock authentication for demo
- ✅ Client-side validation
- ✅ Basic role separation

### For Production
- 🔒 Implement backend authentication
- 🔒 Use JWT tokens (not localStorage)
- 🔒 Hash passwords server-side
- 🔒 Validate all input server-side
- 🔒 Use HTTP-only cookies
- 🔒 Implement CSRF protection
- 🔒 Add rate limiting
- 🔒 Use HTTPS only

## Development Notes

### Adding New Features

1. **New User Fields?**
   - Update User interface
   - Update localStorage structure
   - Update registration form

2. **New Cart Calculations?**
   - Modify CartContext useMemo
   - Add new calculation logic
   - Test with different cart states

3. **New Authentication Methods?**
   - Keep existing user structure
   - Add new handleSubmit for OAuth/etc
   - Maintain localStorage compatibility

### Debugging Tips

```typescript
// Check localStorage
console.log(JSON.parse(localStorage.getItem('user')));
console.log(JSON.parse(localStorage.getItem('cart')));

// Check context values
const { items, total, itemCount } = useCart();
console.log({ items, total, itemCount });

// Monitor state changes
useEffect(() => {
  console.log('Items changed:', items);
}, [items]);
```

## Future Enhancements

1. **Add to Wishlist** - Use similar context pattern
2. **User Preferences** - Expand user object
3. **Payment Integration** - Use cart data for checkout
4. **Order History** - Save completed orders
5. **Notifications** - Push notifications for stock
6. **Reviews & Ratings** - Connect to products
7. **Search History** - Track user searches
8. **Recommendations** - Based on cart/history

## Dependencies Used

- **react** - UI framework
- **next** - React framework
- **next-themes** - Theme switching
- **next-navigation** - Client-side routing
- **lucide-react** - Icons
- @radix-ui/* - Accessible components
- **jotai** or Context API - State management (Context used here)

## Conclusion

This implementation provides a solid foundation for:
- User authentication flows
- Shopping cart management
- Data persistence
- State management

All built with Next.js best practices and TypeScript for type safety.
