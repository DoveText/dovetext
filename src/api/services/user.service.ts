interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async createUser(data: { email: string; password: string; name: string }): Promise<User> {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date();
    
    const user: User = {
      id,
      email: data.email,
      password: data.password, // Note: Should be hashed before storing
      name: data.name,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    this.users.set(id, updated);
    return updated;
  }
}
