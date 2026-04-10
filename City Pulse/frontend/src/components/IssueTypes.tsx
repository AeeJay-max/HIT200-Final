import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Construction, Droplet, Trash, TreeDeciduous, Wrench, Zap } from "lucide-react";
import image1 from '../assets/Trabablas.jpg';
import image2 from '../assets/Mbare Waste Management.jpg';
import image4 from '../assets/Harare Street Lights.jpg'
import image5 from '../assets/ZESA.jpg';
import image6 from '../assets/Victoria Falls.jpg'


const IssueTypes = () => {
  const issueTypes = [
    {
      icon: Construction,
      title: "Road Infrastructure",
      description: "Report potholes, damaged roads, missing manhole covers, broken sidewalks, and faulty traffic lights around Harare. These issues are handled by the Department of Works (Roads Section).",
      image: image1,
      count: "reports",
    },
    {
      icon: Trash,
      title: "Waste Management",
      description: "Report uncollected garbage, overflowing bins, illegal dumpsites, or litter build-up in your area. This is handled by the Department of Works (Waste Management Section).",
      image: image2,
      count: "reports",
    },
    {
      icon: TreeDeciduous,
      title: "Environmental & Sanitation",
      description: "Report blocked storm drains, overgrown grass, open sewage, or areas affected by poor sanitation or environmental neglect. These reports go to the Department of Health Services (Environmental Health Division).",
      image: "https://plus.unsplash.com/premium_photo-1664298311043-46b3814a511f?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
      count: "reports",
    },
    {
      icon: Wrench,
      title: "Public Utilities & Service Delivery",
      description: "Report issues related to street lighting, telecommunications, or other council-managed public service delivery challenges. These are handled by the Department of Works (Public Lighting Section).",
      image: image4,
      count: "reports",
    },
    {
      icon: Zap,
      title: "Electricity & Power Supply",
      description: "Report power outages, damaged power lines, or transformer faults. Electricity services are managed by the Zimbabwe Electricity Transmission and Distribution Company (ZETDC).",
      image: image5,
      count: "reports",
    },
    {
      icon: Droplet,
      title: "Water & Sewerage",
      description: "Report burst or leaking water pipes, sewer blockages, contaminated water, or low water pressure. These issues are handled by the City of Harare Water Department (Harare Water).",
      image: image6,
      count: "reports",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What Can You Report?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform covers a wide range of civic issues to help keep your
            community safe and well-maintained.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {issueTypes.map((type, index) => (
            <Card
              key={index}
              className="group  bg-white/70 dark:bg-gray-500 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={type.image}
                  alt={type.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center">
                  <type.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-sm font-medium">{type.count}</div>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{type.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {type.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IssueTypes;
