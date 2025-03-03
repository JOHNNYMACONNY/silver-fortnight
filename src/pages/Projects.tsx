import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, Briefcase, Clock, Tag } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import type { Collaboration } from '../types';

export function Projects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<Collaboration['status']>();
  const { data: projects, loading, error } = useFirestore<Collaboration>('collaborations');

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || project.status === statusFilter;
    
    const matchesSkills = selectedSkills.length === 0 || 
      project.roles.some(role => role.skills.some(skill => selectedSkills.includes(skill)));
    
    return matchesSearch && matchesStatus && matchesSkills;
  });

  // Get all unique skills for filtering
  const allSkills = Array.from(new Set(
    projects.flatMap(project => project.roles.flatMap(role => role.skills))
  )).sort();

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getAvailableRoles = (project: Collaboration) => {
    return project.roles.filter(role => !role.filled).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Collaboration Projects
        </h1>
        <p className="text-gray-200">
          Find projects to collaborate on or start your own
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-earth-800 border border-earth-700 rounded-lg 
                         text-gray-900 placeholder-gray-500
                         focus:border-accent-clay focus:ring-1 focus:ring-accent-clay/30 
                         transition-all duration-300"
            />
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Briefcase className="h-5 w-5" />
            Create Project
          </button>
        </div>

        {/* Skills Filter */}
        <div className="bg-earth-800 border border-earth-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Filter by Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                  selectedSkills.includes(skill)
                    ? 'bg-accent-clay text-white'
                    : 'bg-earth-700 text-gray-900 hover:bg-earth-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse card p-6">
              <div className="h-6 bg-earth-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-earth-700 rounded w-full"></div>
                <div className="h-4 bg-earth-700 rounded w-5/6"></div>
              </div>
              <div className="h-10 bg-earth-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading projects</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card p-6 card-hover cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-display font-semibold text-gray-900">
                  {project.title}
                </h3>
                <span className={`
                  status-badge
                  ${project.status === 'recruiting' ? 'status-badge-active' : 
                    project.status === 'in-progress' ? 'status-badge-pending' : 
                    'status-badge-completed'}
                `}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-700 mb-6 line-clamp-2">
                {project.description}
              </p>

              {/* Roles */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Open Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {project.roles.filter(role => !role.filled).map((role, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-accent-sage/20 text-gray-900 text-sm rounded-full border border-accent-sage/30"
                    >
                      {role.title}
                    </span>
                  ))}
                  {project.roles.every(role => role.filled) && (
                    <span className="text-sm text-gray-700">All roles filled</span>
                  )}
                </div>
              </div>

              {/* Required Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(project.roles.flatMap(role => role.skills))).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-accent-clay/20 text-gray-900 text-sm rounded-full border border-accent-clay/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-earth-700">
                <div className="flex items-center text-gray-900">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {project.roles.length - getAvailableRoles(project)}/{project.roles.length} filled
                  </span>
                </div>
                <div className="flex items-center text-gray-900">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="bg-earth-800 border border-earth-700 rounded-lg p-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-700">
                  Try adjusting your search or filters
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
