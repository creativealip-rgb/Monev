# 🧪 QA Testing Checklist - Monev App

## Pre-Testing Setup
- [ ] Clear browser cache and local storage
- [ ] Test in incognito/private mode
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile device or responsive mode
- [ ] Verify environment variables are set correctly

---

## 🔐 Authentication & Security

### Login/Signup
- [ ] User can sign up with email/password
- [ ] User can log in with correct credentials
- [ ] Error messages display for invalid credentials
- [ ] "Forgot password" flow works correctly
- [ ] Session persists after browser refresh
- [ ] User can log out successfully
- [ ] Protected routes redirect to login when not authenticated

### Security
- [ ] Passwords are hashed (not visible in DB)
- [ ] API routes require authentication
- [ ] CSRF protection enabled
- [ ] XSS protection (inputs sanitized)
- [ ] No sensitive data in console logs

---

## 💰 Dashboard

### Balance Card
- [ ] Total balance displays correctly
- [ ] Income amount shows in green
- [ ] Expense amount shows in red
- [ ] Growth percentage calculates correctly
- [ ] Theme selector works (Navy/Royal/Sky)
- [ ] Balance breakdown modal opens on click
- [ ] Transfer modal opens from button

### Quick Actions (Features Grid)
- [ ] All 6 feature icons display
- [ ] Icons have correct colors
- [ ] Each link navigates to correct page
- [ ] Hover effects work

### Recent Transactions
- [ ] Transaction list loads
- [ ] Shows empty state when no transactions
- [ ] Loading skeleton displays during fetch
- [ ] Each transaction shows correct amount
- [ ] Income shows + prefix in green
- [ ] Expense shows - prefix in black
- [ ] Category icons display
- [ ] Clicking opens transaction detail

---

## 💳 Transactions Page

### List & Filtering
- [ ] Transactions load with pagination
- [ ] Search filters transactions
- [ ] Filter by category works
- [ ] Filter by type (income/expense) works
- [ ] Filter modal opens/closes correctly
- [ ] "Load more" button works
- [ ] Empty states display correctly

### Transaction Actions
- [ ] Add new transaction works
- [ ] Edit transaction works
- [ ] Delete transaction works (with confirmation)
- [ ] Toast notifications show for actions
- [ ] Transaction detail modal displays all info

---

## 📊 Budgets Page

### Budget Management
- [ ] Budget list loads
- [ ] Add budget modal works
- [ ] Category selection works
- [ ] Budget amount sets correctly
- [ ] Edit budget works
- [ ] Delete budget works
- [ ] Progress bars calculate correctly
- [ ] Danger warning shows when > 90%

### Visual Elements
- [ ] Summary card shows totals
- [ ] Budget cards show correct percentages
- [ ] Icons display per category
- [ ] Loading skeleton displays

---

## 🏦 Savings/Goals Page

### Goals Management
- [ ] Goals list loads
- [ ] Add goal modal works
- [ ] Icon selection works
- [ ] Target amount saves
- [ ] Current amount updates
- [ ] Deadline date picker works
- [ ] Progress bar shows correctly
- [ ] Delete goal works

### Summary
- [ ] Total savings calculated
- [ ] Progress percentage correct
- [ ] Motivational quote displays

---

## 📋 Bills Page

### Bill Management
- [ ] Bills list loads
- [ ] Add bill modal works
- [ ] Due date selection works
- [ ] Toggle paid status works
- [ ] Delete bill works
- [ ] Status badges display correctly
- [ ] Overdue bills highlighted

### Tabs
- [ ] "All" tab shows all bills
- [ ] "Unpaid" tab filters unpaid
- [ ] "Paid" tab shows paid bills
- [ ] Counts update correctly

---

## 📈 Investments Page

### Portfolio
- [ ] Investments list loads
- [ ] Total value calculated
- [ ] Profit/loss calculated correctly
- [ ] Add investment works
- [ ] Edit investment works
- [ ] Delete investment works

### Asset Details
- [ ] Quantity displays
- [ ] Current price shows
- [ ] Platform name shows
- [ ] Asset type icon displays

---

## 📊 Analytics Page

### Charts & Stats
- [ ] Stats cards display correct values
- [ ] Category breakdown pie chart renders
- [ ] Expense vs Income toggle works
- [ ] AI insights generate
- [ ] Health metrics calculate

### Error Handling
- [ ] Error state displays on fetch failure
- [ ] Retry button works
- [ ] Loading skeleton displays

---

## 💬 Chat Page (Monev AI)

### Chat Functionality
- [ ] Messages send successfully
- [ ] AI responds to queries
- [ ] Quick actions work
- [ ] Message history loads
- [ ] Typing indicator shows
- [ ] Error handling for failed messages

---

## 🎨 UI/UX Checks

### Theme Consistency
- [ ] Sky blue primary color used throughout
- [ ] Gradients consistent
- [ ] Button styles consistent
- [ ] Card shadows consistent
- [ ] Border radius consistent (rounded-xl/2xl/3xl)

### Loading States
- [ ] Skeleton loaders show during fetch
- [ ] Spinners show for actions
- [ ] Loading text displays appropriately

### Empty States
- [ ] Appropriate empty state for each page
- [ ] Illustration displays
- [ ] Call-to-action buttons work
- [ ] Contextual messages display

### Toast Notifications
- [ ] Success toasts show for actions
- [ ] Error toasts show for failures
- [ ] Warning toasts where appropriate
- [ ] Toasts dismiss automatically
- [ ] Manual dismiss works

### Animations
- [ ] Page transitions smooth
- [ ] Card hover effects work
- [ ] Button press feedback
- [ ] Modal open/close animations
- [ ] List item animations

---

## 📱 Mobile Responsiveness

### Layout
- [ ] Max-width container works
- [ ] Content doesn't overflow horizontally
- [ ] Touch targets >= 44px
- [ ] Bottom nav accessible
- [ ] FAB doesn't obstruct content

### Touch Interactions
- [ ] Swipe gestures work (if implemented)
- [ ] Pull-to-refresh works
- [ ] Long press works (if implemented)
- [ ] Tap feedback immediate

---

## 🔄 Offline & Error Handling

### Network Errors
- [ ] Offline state displays
- [ ] Retry button works
- [ ] Cached data shows when available
- [ ] API errors handled gracefully

### Form Validation
- [ ] Required fields validated
- [ ] Number formats validated
- [ ] Email format validated
- [ ] Error messages clear

---

## 🔧 Performance Checks

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] API responses < 1 second
- [ ] Images optimized
- [ ] No unnecessary re-renders

### Bundle Size
- [ ] No duplicate dependencies
- [ ] Tree-shaking works
- [ ] Code splitting applied

---

## ✅ Sign-off

**Tester:** _______________
**Date:** _______________
**Environment:** _______________
**Browser(s):** _______________

**Overall Status:** [ ] PASS [ ] FAIL [ ] CONDITIONAL PASS

**Notes:**
```
[Space for notes]
```

---

## 🐛 Known Issues

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |
| | | | |
| | | | |

---

*Last Updated: [Date]*
