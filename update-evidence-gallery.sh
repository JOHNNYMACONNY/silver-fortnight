#!/bin/bash

# Update all occurrences of evidenceItems to evidence in EvidenceGallery components
find src -type f -name "*.tsx" -exec sed -i '' 's/<EvidenceGallery evidenceItems=/<EvidenceGallery evidence=/g' {} \;

echo "Updated all EvidenceGallery components to use 'evidence' prop instead of 'evidenceItems'"
