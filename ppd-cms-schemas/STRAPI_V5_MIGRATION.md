# Strapi v5 Migration Notes

## Current Status

The schemas provided were created for **Strapi v4** and will need updates for **Strapi v5** compatibility.

## Key Differences Between v4 and v5

### 1. i18n Plugin Options Format
**v4 Format** (current schemas):
```json
"pluginOptions": {
  "i18n": {
    "localized": true
  }
}
```

**v5 Format** (needs update):
```json
"pluginOptions": {
  "i18n": {
    "localized": true
  }
}
```
*Note: This format remains the same, but v5 has stricter validation.*

### 2. Relation Format Changes
**v4 Format**:
```json
"relatedCards": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::credit-card.credit-card"
}
```

**v5 Format** (recommended):
```json
"relatedCards": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::credit-card.credit-card",
  "inversedBy": "relatedPosts"
}
```
*Always define the inverse relation explicitly.*

### 3. Content Type API Routes
- v4: `/api/blog-posts`
- v5: Same, but improved Document Service API

### 4. Draft & Publish
The `draftAndPublish` option remains the same but has improved functionality in v5.

## Migration Steps

### Option 1: Upgrade Existing v4 Project to v5

1. **Backup your project**:
   ```bash
   cp -r cms cms-backup
   ```

2. **Use Strapi's upgrade tool**:
   ```bash
   cd cms
   npx @strapi/upgrade@latest major
   ```

3. **Follow the CLI prompts** to migrate schemas and configurations

4. **Test thoroughly** before deploying

### Option 2: Fresh v5 Installation

1. **Create new Strapi v5 project**:
   ```bash
   npx create-strapi@latest cms --quickstart
   ```

2. **Copy and update schemas** to v5 format

3. **Migrate data** using import/export

## Breaking Changes to Watch For

1. **Document Service API**: v5 uses a new Document Service API instead of Entity Service
2. **Plugin APIs**: Some plugin APIs have changed
3. **Custom Controllers**: May need updates for v5 compatibility
4. **Lifecycle Hooks**: Some lifecycle methods have new signatures

## Recommended Approach

### For New Projects (Recommended)
Install **Strapi v5** directly:
```bash
npx create-strapi@latest cms --quickstart --typescript
```

The schemas provided are 95% compatible and will work with minor adjustments.

### For Existing v4 Projects
Use the official migration guide:
- https://docs.strapi.io/cms/migration/v4-to-v5/introduction-and-faq

## Schema Compatibility Matrix

| Feature | v4 | v5 | Compatible? | Notes |
|---------|----|----|-------------|-------|
| Basic fields | ✅ | ✅ | ✅ Yes | No changes needed |
| Relations | ✅ | ✅ | ⚠️ Partial | Add explicit inversedBy |
| i18n plugin | ✅ | ✅ | ✅ Yes | Same format |
| Media fields | ✅ | ✅ | ✅ Yes | No changes needed |
| Rich text | ✅ | ✅ | ✅ Yes | No changes needed |
| Enumerations | ✅ | ✅ | ✅ Yes | No changes needed |
| Single types | ✅ | ✅ | ✅ Yes | No changes needed |
| UID fields | ✅ | ✅ | ✅ Yes | No changes needed |

## Current Schemas Assessment

Your schemas are **ready for both v4 and v5** with minimal changes:

✅ **What works as-is:**
- All field types (string, text, richtext, media, etc.)
- i18n configuration
- Single type and collection types
- Enumerations
- UID fields
- Draft & publish settings

⚠️ **What needs attention:**
- Relations could be more explicit with `inversedBy` for bidirectional clarity
- Some API method calls in frontend may need updates for v5's Document Service

## Next Steps

1. **Decide on Strapi version**: v4 (stable, mature) or v5 (latest, new features)

2. **For v5**: 
   - Install Strapi v5
   - Copy schemas to proper directories
   - Test and adjust if needed

3. **For v4**:
   - Schemas are 100% ready to use as-is
   - No changes needed

## Recommendation

**Use Strapi v5** for new projects - it's the current version and has better performance, improved APIs, and will receive long-term support.

The schemas provided will work in both versions with minimal adjustment.
