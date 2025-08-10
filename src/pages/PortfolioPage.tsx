import React from 'react';
import { useAuth } from '../AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Star, Calendar, Award, ExternalLink, Github, Globe } from 'lucide-react';

const PortfolioPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Mock portfolio data - in a real app, this would come from the user's profile
  const portfolioItems = [
    {
      id: 1,
      title: "Web Development Portfolio",
      description: "Modern React applications with TypeScript and Tailwind CSS",
      skills: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
      completedDate: "2024-01-15",
      rating: 4.8,
      link: "https://github.com/user/portfolio",
      type: "project"
    },
    {
      id: 2,
      title: "Logo Design for Local Business",
      description: "Complete brand identity design including logo, color scheme, and marketing materials",
      skills: ["Adobe Illustrator", "Figma", "Brand Design"],
      completedDate: "2024-02-20",
      rating: 5.0,
      link: "https://behance.net/user/project",
      type: "design"
    },
    {
      id: 3,
      title: "Mobile App UI/UX Design",
      description: "User interface design for iOS and Android fitness tracking app",
      skills: ["UI/UX Design", "Figma", "Mobile Design", "User Research"],
      completedDate: "2024-03-10",
      rating: 4.9,
      link: "https://figma.com/user/project",
      type: "design"
    }
  ];

  const stats = {
    totalProjects: 15,
    averageRating: 4.7,
    skillsCount: 12,
    completedTrades: 8
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {currentUser ? `${currentUser.displayName}'s Portfolio` : 'Portfolio'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Showcase your best work and skills to attract potential trading partners
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalProjects}</div>
          <div className="text-sm text-muted-foreground">Total Projects</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center text-2xl font-bold text-primary">
            {stats.averageRating}
            <Star className="h-5 w-5 ml-1 fill-current" />
          </div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">{stats.skillsCount}</div>
          <div className="text-sm text-muted-foreground">Skills</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">{stats.completedTrades}</div>
          <div className="text-sm text-muted-foreground">Completed Trades</div>
        </Card>
      </div>

      {/* Portfolio Items */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Portfolio Items</h2>
          <Button>
            <Award className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {item.type}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(item.completedDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                    {item.rating}
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Project
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State for New Users */}
      {portfolioItems.length === 0 && (
        <Card className="p-12 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Build Your Portfolio
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start showcasing your work to attract better trades and collaboration opportunities
          </p>
          <Button>
            <Award className="h-4 w-4 mr-2" />
            Add Your First Project
          </Button>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="p-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Ready to Start Trading?
        </h3>
        <p className="text-muted-foreground mb-4">
          Your portfolio showcases your skills. Now find others to trade with!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <a href="/trades">Browse Trades</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/collaborations">Find Collaborations</a>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioPage; 