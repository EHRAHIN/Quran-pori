import { Item } from '../models/Item.js';
import mongoose from 'mongoose';

// Initial fallback mock data if MongoDB is temporarily offline or empty
let inMemoryItems = [
  {
    _id: '1',
    title: 'Cloud Infrastructure Upgrade',
    category: 'DevOps',
    status: 'In Progress',
    priority: 'High',
    budget: 4500,
    clientName: 'Apex Cloud Ltd.',
    assignedTo: 'Tanvir Ahmed',
    description: 'Migrating legacy microservices to Kubernetes clusters.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    title: 'Mobile Banking API Integration',
    category: 'Backend',
    status: 'Completed',
    priority: 'High',
    budget: 7200,
    clientName: 'TrustPay Financials',
    assignedTo: 'Nusrat Jahan',
    description: 'Secure payment gateway webhook processing and audit logs.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    title: 'Brand Design System 2.0',
    category: 'Design',
    status: 'In Progress',
    priority: 'Medium',
    budget: 3100,
    clientName: 'Lumina Studio',
    assignedTo: 'Sabbir Hossain',
    description: 'Component library design tokens, dark mode guidelines, and typography.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '4',
    title: 'Customer Analytics Dashboard',
    category: 'Frontend',
    status: 'Pending',
    priority: 'Medium',
    budget: 5200,
    clientName: 'Veloce Global',
    assignedTo: 'Rahim Khan',
    description: 'Real-time telemetry and funnel conversion charts using React & Vite.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '5',
    title: 'Security Compliance Audit (ISO 27001)',
    category: 'Security',
    status: 'In Progress',
    priority: 'High',
    budget: 6800,
    clientName: 'Nexus Enterprise',
    assignedTo: 'Fahim Rahman',
    description: 'Penetration testing and RBAC privilege level verification.',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc Get all items with optional search & filter
// @route GET /api/items
export const getItems = async (req, res, next) => {
  try {
    const { search, status, category, priority } = req.query;

    if (isDbConnected()) {
      let query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          { assignedTo: { $regex: search, $options: 'i' } },
        ];
      }
      if (status && status !== 'All') query.status = status;
      if (category && category !== 'All') query.category = category;
      if (priority && priority !== 'All') query.priority = priority;

      const items = await Item.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: items.length, source: 'mongodb', data: items });
    }

    // Fallback in-memory filter
    let filtered = [...inMemoryItems];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.clientName.toLowerCase().includes(q) ||
          i.assignedTo.toLowerCase().includes(q)
      );
    }
    if (status && status !== 'All') {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (category && category !== 'All') {
      filtered = filtered.filter((i) => i.category === category);
    }
    if (priority && priority !== 'All') {
      filtered = filtered.filter((i) => i.priority === priority);
    }

    return res.json({
      success: true,
      count: filtered.length,
      source: 'in-memory (connect MongoDB in .env for persistent database storage)',
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single item
// @route GET /api/items/:id
export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const item = await Item.findById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.json({ success: true, data: item });
    }

    const item = inMemoryItems.find((i) => i._id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc Create new item
// @route POST /api/items
export const createItem = async (req, res, next) => {
  try {
    const { title, category, status, priority, budget, clientName, assignedTo, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (isDbConnected()) {
      const newItem = await Item.create({
        title,
        category: category || 'General',
        status: status || 'Pending',
        priority: priority || 'Medium',
        budget: Number(budget) || 0,
        clientName: clientName || 'Internal',
        assignedTo: assignedTo || 'Unassigned',
        description: description || '',
      });
      return res.status(201).json({ success: true, data: newItem });
    }

    const newItem = {
      _id: Date.now().toString(),
      title,
      category: category || 'General',
      status: status || 'Pending',
      priority: priority || 'Medium',
      budget: Number(budget) || 0,
      clientName: clientName || 'Internal',
      assignedTo: assignedTo || 'Unassigned',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryItems.unshift(newItem);
    return res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
};

// @desc Update item
// @route PUT /api/items/:id
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const updated = await Item.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.json({ success: true, data: updated });
    }

    const index = inMemoryItems.findIndex((i) => i._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    inMemoryItems[index] = {
      ...inMemoryItems[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: inMemoryItems[index] });
  } catch (error) {
    next(error);
  }
};

// @desc Delete item
// @route DELETE /api/items/:id
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await Item.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.json({ success: true, message: 'Item deleted successfully' });
    }

    const index = inMemoryItems.findIndex((i) => i._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    inMemoryItems.splice(index, 1);
    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
