# Connect Button State Update Debugging Guide

## 1. Component State Verification
- [ ] Check initial state setup
  ```typescript
  // Verify state is properly initialized
  const [connectionStatus, setConnectionStatus] = useState(initialStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  ```
- [ ] Verify state updates using React DevTools
  - Open React DevTools > Components
  - Select UserProfileCard component
  - Monitor state changes during button click
  - Confirm state updates trigger re-renders

## 2. API Integration Checks
- [ ] Verify API call execution
  ```typescript
  // Add debugging logs
  console.log('Sending connection request:', { currentUserId, targetUserId });
  try {
    await sendConnectionRequest(currentUserId, targetUserId);
    console.log('Connection request successful');
  } catch (err) {
    console.error('Connection request failed:', err);
  }
  ```
- [ ] Check Network Tab
  - Open DevTools > Network
  - Filter by "Fetch/XHR"
  - Verify request payload
  - Check response status and data

## 3. State Update Flow
- [ ] Verify optimistic updates
  ```typescript
  const handleConnect = async () => {
    if (!currentUserId || isConnecting) return;
    
    // Log state before update
    console.log('Before state update:', connectionStatus);
    
    setIsConnecting(true);
    setConnectionStatus('pending');
    
    // Log state after update
    console.log('After optimistic update:', connectionStatus);
    
    try {
      await sendConnectionRequest(currentUserId, profile.id);
      // Log successful state
      console.log('After API success:', connectionStatus);
    } catch (err) {
      // Log error state reversion
      console.log('Reverting state due to error');
      setConnectionStatus('none');
    } finally {
      setIsConnecting(false);
    }
  };
  ```

## 4. Component Re-render Verification
- [ ] Add render logging
  ```typescript
  console.log('UserProfileCard render:', {
    profile,
    connectionStatus,
    isConnecting
  });
  ```
- [ ] Check component update triggers
  - Verify props changes
  - Monitor state updates
  - Check parent component re-renders

## 5. Race Condition Checks
- [ ] Verify request debouncing
  ```typescript
  // Check if already connecting
  if (isConnecting) {
    console.log('Request in progress, skipping');
    return;
  }
  ```
- [ ] Add request tracking
  ```typescript
  const requestRef = useRef(false);
  
  useEffect(() => {
    return () => {
      requestRef.current = false;
    };
  }, []);
  
  const handleConnect = async () => {
    if (requestRef.current) return;
    requestRef.current = true;
    
    try {
      // ... connection logic
    } finally {
      requestRef.current = false;
    }
  };
  ```

## 6. Error Handling Verification
- [ ] Check error state management
  ```typescript
  const [error, setError] = useState<string | null>(null);
  
  const handleConnect = async () => {
    setError(null);
    try {
      await sendConnectionRequest(currentUserId, profile.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionStatus('none');
    }
  };
  ```
- [ ] Verify error UI updates
  ```typescript
  {error && (
    <div className="text-red-500 text-sm mt-2">
      {error}
    </div>
  )}
  ```

## 7. Props and Callback Verification
- [ ] Check prop updates
  ```typescript
  useEffect(() => {
    console.log('Props updated:', {
      initialStatus,
      connectionStatus
    });
    setConnectionStatus(initialStatus);
  }, [initialStatus]);
  ```
- [ ] Verify callback execution
  ```typescript
  const handleConnect = async () => {
    try {
      await sendConnectionRequest(currentUserId, profile.id);
      onConnect?.(true);
      console.log('Success callback executed');
    } catch (err) {
      onConnect?.(false);
      console.log('Error callback executed');
    }
  };
  ```

## 8. Common Issues and Solutions

### State Not Updating
- Verify setState is called within component
- Check for closure issues in async functions
- Ensure state updates are not batched unexpectedly

### Button Not Disabling
- Verify disabled prop is properly set
- Check CSS classes for disabled state
- Confirm loading state management

### Inconsistent State
- Check for race conditions
- Verify cleanup on unmount
- Ensure proper error state handling

### Network Issues
- Verify API endpoint configuration
- Check CORS settings
- Validate request/response format

## 9. Testing Steps

1. Click Connect button and verify:
   - Button shows loading state
   - State updates to 'pending'
   - Network request is sent
   - Success/error handling works

2. Test error scenarios:
   - Network failure
   - API errors
   - Invalid responses

3. Verify state consistency:
   - Multiple rapid clicks
   - Component unmount during request
   - Page navigation during request

## 10. Performance Optimization

- [ ] Add request caching
- [ ] Implement proper cleanup
- [ ] Add error boundaries
- [ ] Optimize re-renders
- [ ] Add request timeouts

## 11. Debugging Commands

```javascript
// Debug render cycles
const debugRender = () => {
  console.group('UserProfileCard Render');
  console.log('Props:', { profile, connectionStatus });
  console.log('State:', { isConnecting, error });
  console.groupEnd();
};

// Debug state updates
const debugStateUpdate = (prevState: string, newState: string) => {
  console.group('State Update');
  console.log('Previous:', prevState);
  console.log('New:', newState);
  console.log('Stack:', new Error().stack);
  console.groupEnd();
};

// Debug API calls
const debugApiCall = async (fn: () => Promise<any>) => {
  console.time('API Call');
  try {
    const result = await fn();
    console.log('API Success:', result);
  } catch (err) {
    console.error('API Error:', err);
  }
  console.timeEnd('API Call');
};
```