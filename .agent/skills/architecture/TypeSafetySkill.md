# Type Safety Skill

## Overview
A comprehensive skill for preventing type errors in code through proactive practices, defensive programming, and leveraging type systems effectively.

## Core Principles

### 1. Embrace Strong Typing
- Use strongly typed languages when possible
- Leverage type annotations and declarations
- Avoid loose typing unless absolutely necessary

### 2. Defensive Programming
- Validate inputs at boundaries
- Handle edge cases explicitly
- Use assertions for internal consistency checks

### 3. Gradual Type Adoption
- Introduce types incrementally in legacy codebases
- Use type checking tools even in dynamically typed languages
- Maintain backward compatibility during transitions

## Best Practices for Type Error Prevention

### Static Analysis Tools
- Implement type checkers like TypeScript, Flow, MyPy, or similar
- Configure strict null checks and type validation
- Integrate type checking into CI/CD pipelines

### Explicit Type Definitions
- Define interfaces and type definitions upfront
- Use enums for known value sets
- Create custom types for domain-specific concepts

### Input Validation
- Sanitize and validate all external inputs
- Use runtime type checking libraries when needed
- Implement proper error handling for type mismatches

### Code Reviews and Testing
- Include type safety in code review checklists
- Write unit tests covering type-related edge cases
- Use property-based testing to validate type contracts

## Concrete Examples

### JavaScript/TypeScript Example
```typescript
// Bad: No type safety
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good: With type safety
interface Item {
  name: string;
  price: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Python Example
```python
# Bad: No type hints
def get_user_age(user):
    return user['age']

# Good: With type hints
from typing import Dict, Union

def get_user_age(user: Dict[str, Union[str, int]]) -> int:
    age = user.get('age')
    if not isinstance(age, int):
        raise TypeError("Age must be an integer")
    return age
```

## Implementation Checklist
- [ ] Enable strict type checking in your development environment
- [ ] Add type annotations to new code
- [ ] Configure type checking in your build process
- [ ] Establish team conventions for type usage
- [ ] Regularly audit code for type inconsistencies
- [ ] Document type expectations for public APIs