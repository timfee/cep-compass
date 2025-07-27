# Claude AI Assistant Instructions for CEP Compass

## Primary Instructions

Please refer to [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for the complete, authoritative instruction set that is shared across all AI agents.

## Claude-Specific Additions

### When Using Claude Code CLI

1. **Use TodoWrite tool** for complex multi-step tasks
2. **Batch tool calls** when possible for performance
3. **Run build/lint** after making changes: `npm run build && npm run lint`
4. **Check for duplicates** before creating new files
5. **Prefer editing** existing files over creating new ones

### Claude-Specific Context

You have access to:
- File system tools (Read, Write, Edit, MultiEdit)
- Bash command execution
- Search tools (Grep, Glob)
- Web search and fetch capabilities
- GitHub integration tools
- Todo list management

### Important Reminders

1. **NEVER add googleapis** as a dependency - we use lightweight HTTP calls
2. **Always use OnPush** change detection strategy
3. **Services go in `/src/app/services/`** not `/src/app/shared/services/`
4. **Test the build** after changes with `npm run build`
5. **Follow Angular v20 patterns** - signals, standalone components, new control flow

### Current Project State

- ✅ Modern Angular patterns implemented correctly
- ✅ Material Design 3 theming configured
- ⚠️ Authentication has race conditions (issue #73)
- ⚠️ Token storage needs encryption (issue #72)
- ⚠️ Missing CSRF protection (issue #79)
- ⚠️ No mobile navigation (issue #75)
- ⚠️ Missing loading states (issue #74)
- ⚠️ Zero test coverage for AuthService (issue #76)
- ⚠️ No E2E tests (issue #77)
- ⚠️ Minimal unit test coverage (issue #78)

### Quick Reference

```bash
# Common commands
npm run build          # Build the project
npm run lint          # Run linting
npm test              # Run unit tests
npm run start         # Start dev server
ng generate component # Generate new component
```

### File Generation Template

When creating new components, use this template:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-name',
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class FeatureNameComponent {
  // Follow patterns in AI_AGENT_INSTRUCTIONS.md
}
```

Remember: The source of truth for all coding standards and patterns is [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md).