import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Globe, ChevronRight, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function News() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['news', filter, user?.chapterId],
    queryFn: async () => {
      let query = {};
      if (filter === 'local' && user?.chapterId) {
        query.chapterId = user.chapterId;
      } else if (filter === 'global') {
        query.isGlobal = true;
      }
      return base44.entities.NewsPost.filter(query, '-created_date', 50);
    },
    enabled: !!user
  });

  const upcomingEvents = posts.filter(p => p.eventDate && moment(p.eventDate).isAfter(moment()));
  const newsPosts = posts.filter(p => !p.eventDate || moment(p.eventDate).isBefore(moment()));

  const canCreatePost = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">News & Events</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stay updated with YEF</p>
        </div>
        {canCreatePost && (
          <Link to={createPageUrl('CreateNews')}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Post
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="w-full grid grid-cols-3 bg-slate-100">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="local">
            <MapPin className="w-3 h-3 mr-1" />
            Local
          </TabsTrigger>
          <TabsTrigger value="global">
            <Globe className="w-3 h-3 mr-1" />
            Global
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Upcoming Events
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xs font-medium text-blue-600">
                      {moment(event.eventDate).format('MMM')}
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {moment(event.eventDate).format('D')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{event.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">{event.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {event.isGlobal ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      ) : event.chapterName && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.chapterName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Posts */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3">Latest Updates</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : newsPosts.length > 0 ? (
          <div className="space-y-4">
            {newsPosts.map(post => (
              <div 
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
              >
                {post.image && (
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isGlobal ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[10px]">
                        Global
                      </Badge>
                    ) : post.chapterName && (
                      <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px]">
                        {post.chapterName}
                      </Badge>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {moment(post.created_date).fromNow()}
                    </span>
                    {post.created_by && (
                      <span className="text-[10px] text-slate-400 ml-auto">
                        by {post.created_by}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{post.title}</h3>
                  <div 
                    className="text-sm text-slate-600 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No news posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}