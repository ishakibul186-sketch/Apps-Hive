import React from 'react';
import { FacebookIcon, InstagramIcon, WebsiteIcon } from '../components/icons/Icons';

// Path to the owner's picture as requested by the user.
// This is now a relative path, which will be resolved from the root thanks to the <base> tag in index.html.
const ownerPicturePath = 'assets/icon/ownerpicture.png';


const AboutPage: React.FC = () => {
    const ownerDetails = {
        photo: ownerPicturePath,
        name: 'Shakibul Islam Prohor',
        title: 'Owner & Lead Developer',
        about: "I started programming from class six and slowly learned programming. I learned programming by myself at home. Slowly I learned more special things about programming. I learned block programming at home for about two to three years. Again, I am programming an Android. I do it by phone.",
    };

    const platformInfo = {
        offer: [
            { title: 'Tools Hub', description: 'A suite of essential utilities to boost your productivity.' },
            { title: 'App List', description: 'Discover and download hand-picked applications for your needs.' },
            { title: 'Personalized Experience', description: 'Manage your profile and preferences with ease.' },
        ],
        benefits: 'Enjoy the convenience of having everything in one place, saving you time and effort. Our goal is to provide a seamless and efficient experience, helping you find the right tool for the right job, instantly.',
    };

    const socialLinks = [
        { name: 'Facebook', url: 'https://www.facebook.com/prohor245', icon: <FacebookIcon className="w-6 h-6" /> },
        { name: 'Instagram', url: 'https://www.instagram.com/about_prohor/', icon: <InstagramIcon className="w-6 h-6" /> },
        { name: 'Website', url: 'https://apps-hive-view.web.app/', icon: <WebsiteIcon className="w-6 h-6" /> },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-text-primary min-h-full bg-primary animate-fade-in-right">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Owner Section */}
                <section className="bg-secondary rounded-2xl shadow-lg border border-accent p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="flex-shrink-0">
                            <img 
                                src={ownerDetails.photo} 
                                alt={ownerDetails.name}
                                className="w-36 h-36 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-brand/50 shadow-lg bg-accent"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{ownerDetails.name}</h1>
                            <p className="text-lg text-brand font-semibold mt-1">{ownerDetails.title}</p>
                            <p className="text-text-secondary mt-4 leading-relaxed">{ownerDetails.about}</p>
                        </div>
                    </div>
                </section>

                {/* Platform Info Section */}
                <section className="bg-secondary rounded-2xl shadow-lg border border-accent p-8">
                    <h2 className="text-3xl font-bold text-center mb-8">About <span className="text-brand">Apps Hive</span></h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary mb-4">What We Offer</h3>
                            <ul className="space-y-3">
                                {platformInfo.offer.map(item => (
                                    <li key={item.title} className="flex items-start">
                                        <div className="flex-shrink-0 h-6 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-brand"></span>
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-semibold">{item.title}</p>
                                            <p className="text-text-secondary text-sm">{item.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary mb-4">Your Benefits</h3>
                            <p className="text-text-secondary leading-relaxed">{platformInfo.benefits}</p>
                        </div>
                    </div>
                </section>

                {/* Social Links Section */}
                <section className="bg-secondary rounded-2xl shadow-lg border border-accent p-8">
                    <h2 className="text-3xl font-bold text-center mb-6">Connect With Me</h2>
                    <div className="flex justify-center items-center gap-6">
                        {socialLinks.map(link => (
                            <a 
                                key={link.name} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-text-secondary hover:text-brand transition-colors duration-300 p-3 bg-accent rounded-full transform hover:scale-110"
                                aria-label={`Visit my ${link.name} profile`}
                            >
                                {link.icon}
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AboutPage;