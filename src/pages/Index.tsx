import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Users, MessageSquare, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="glass rounded-3xl p-12 hover-lift">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-12 h-12 text-primary" />
            <h1 className="text-6xl font-bold gradient-text">ClassTrack</h1>
          </div>
          <p className="text-2xl text-foreground mb-8">
            Real-Time Classroom Management System
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage and track classroom occupancy in real-time. Perfect for CRs and students
            to find vacant classrooms, update schedules, and coordinate efficiently.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="hover-glow text-lg px-8"
            >
              Get Started
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="lg"
              className="glass hover-lift text-lg px-8"
            >
              View Dashboard
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6 hover-lift hover-glow">
            <Calendar className="w-10 h-10 text-primary mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Real-Time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Instant updates on classroom availability and schedules
            </p>
          </div>
          <div className="glass rounded-2xl p-6 hover-lift hover-glow">
            <Users className="w-10 h-10 text-secondary mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">CR Verification</h3>
            <p className="text-sm text-muted-foreground">
              Secure access control with branch-specific CR codes
            </p>
          </div>
          <div className="glass rounded-2xl p-6 hover-lift hover-glow">
            <MessageSquare className="w-10 h-10 text-accent mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">CR Chat Lobby</h3>
            <p className="text-sm text-muted-foreground">
              Communicate across branches for better coordination
            </p>
          </div>
          <div className="glass rounded-2xl p-6 hover-lift hover-glow">
            <Clock className="w-10 h-10 text-primary mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Auto Management</h3>
            <p className="text-sm text-muted-foreground">
              Automatic status updates when class duration expires
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
