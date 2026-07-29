import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCategories as fetchCategoriesAPI } from '../../api/medicalInventory';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { SupplyCategory } from '../../types';

interface CategoryTreeNode extends SupplyCategory {
  children: CategoryTreeNode[];
  [key: string]: unknown;
}

interface CategoryOption {
  id: string;
  name: string;
  depth: number;
  path: string;
  label: string;
  [key: string]: unknown;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

/**
 * Build a tree structure from flat category data
 */
function buildCategoryTree(categories: SupplyCategory[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // First pass: create a map of all categories
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build the tree
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Get all category IDs in a subtree (including the root)
 */
function getCategoryAndDescendantIds(category: CategoryTreeNode): string[] {
  const ids = [category.id];
  if (category.children) {
    category.children.forEach(child => {
      ids.push(...getCategoryAndDescendantIds(child));
    });
  }
  return ids;
}

/**
 * Hook for managing category list with React Query caching and tree structure
 */
export function useCategoryList() {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Query for categories
  const categoriesQuery = useQuery({
    queryKey: QUERY_KEYS.medicalCategories,
    queryFn: async () => {
      const { data, error } = await fetchCategoriesAPI();
      if (error) throw error;
      return data || [];
    },
  });

  const categories = categoriesQuery.data || [];

  // Refresh with cache invalidation
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicalCategories });
  }, [queryClient]);

  // Build tree structure from flat data
  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Get flat list for dropdowns (with indentation info)
  const categoryOptions = useMemo((): CategoryOption[] => {
    const options: CategoryOption[] = [];

    function traverse(nodes: CategoryTreeNode[], depth = 0, parentPath = '') {
      nodes.forEach(node => {
        const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
        options.push({
          id: node.id,
          name: node.name,
          depth,
          path,
          label: '  '.repeat(depth) + node.name
        });
        if (node.children) {
          traverse(node.children, depth + 1, path);
        }
      });
    }

    traverse(categoryTree);
    return options;
  }, [categoryTree]);

  // Get selected category and all its descendant IDs (for filtering items)
  const selectedCategoryIds = useMemo((): string[] | null => {
    if (!selectedCategoryId) return null;

    // Find the category in the tree
    function findCategory(nodes: CategoryTreeNode[]): CategoryTreeNode | null {
      for (const node of nodes) {
        if (node.id === selectedCategoryId) return node;
        if (node.children) {
          const found = findCategory(node.children);
          if (found) return found;
        }
      }
      return null;
    }

    const category = findCategory(categoryTree);
    if (!category) return [selectedCategoryId];

    return getCategoryAndDescendantIds(category);
  }, [selectedCategoryId, categoryTree]);

  // Toggle expanded state
  const toggleExpanded = useCallback((categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Expand all categories
  const expandAll = useCallback(() => {
    const allIds = new Set(categories.map(c => c.id));
    setExpandedIds(allIds);
  }, [categories]);

  // Collapse all categories
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Select a category (for filtering)
  const selectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  // Clear selection (show all items)
  const clearSelection = useCallback(() => {
    setSelectedCategoryId(null);
  }, []);

  // Get breadcrumb path for a category
  const getBreadcrumb = useCallback((categoryId: string | null): BreadcrumbItem[] => {
    if (!categoryId) return [];

    const path: BreadcrumbItem[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = categories.find(c => c.id === currentId);
      if (category) {
        path.unshift({ id: category.id, name: category.name });
        currentId = category.parent_id;
      } else {
        break;
      }
    }

    return path;
  }, [categories]);

  return {
    // State
    categories,
    categoryTree,
    categoryOptions,
    expandedIds,
    selectedCategoryId,
    selectedCategoryIds,
    error: categoriesQuery.error?.message || '',
    loading: categoriesQuery.isLoading,

    // Actions
    refresh,
    toggleExpanded,
    expandAll,
    collapseAll,
    selectCategory,
    clearSelection,
    getBreadcrumb,
    setError: () => {} // No-op, errors come from queries
  };
}
